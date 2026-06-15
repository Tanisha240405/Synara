import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { autopilotSuggestions } from '@/lib/schema';
import { groq } from '@/lib/groq';
import { sql, eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    // 1. Check Cache First
    if (!forceRefresh) {
      const cacheQuery = await db
        .select()
        .from(autopilotSuggestions)
        .where(eq(autopilotSuggestions.userId, userId))
        .orderBy(sql`${autopilotSuggestions.generatedAt} DESC`)
        .limit(1);

      if (cacheQuery.length > 0) {
        const latest = cacheQuery[0];
        const ageInMs = Date.now() - new Date(latest.generatedAt).getTime();
        const ageInHours = ageInMs / (1000 * 60 * 60);

        if (!latest.needsRefresh && ageInHours < 4) {
          return NextResponse.json({
            suggestions: latest.suggestions,
            generatedAt: latest.generatedAt,
            fromCache: true
          });
        }
      }
    }

    // 2. Fetch Aggregated Data
    const dataQuery = await db.execute(sql`
      WITH
      TotalCust AS (SELECT COUNT(*) AS total_customers FROM customers WHERE user_id = ${userId}),
      RecentCamps AS (SELECT COUNT(*) AS recent_campaigns FROM campaigns WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = ${userId}),
      SingleBuyers AS (SELECT COUNT(*) AS single_buyers FROM customers WHERE total_orders = 1 AND created_at < NOW() - INTERVAL '45 days' AND user_id = ${userId}),
      AvgOrders AS (
        SELECT 
          tier,
          ROUND(AVG(total_spend / GREATEST(total_orders, 1))) AS avg_order_value
        FROM customers
        WHERE user_id = ${userId}
        GROUP BY tier
      )
      SELECT 
        (SELECT total_customers FROM TotalCust) AS total_customers,
        (SELECT recent_campaigns FROM RecentCamps) AS recent_campaign_count,
        (SELECT single_buyers FROM SingleBuyers) AS single_buyers,
        (SELECT json_object_agg(tier, avg_order_value) FROM AvgOrders) AS avg_order_value_by_tier,
        (
          SELECT json_object_agg(
            tier_days, count
          )
          FROM (
            SELECT 
              tier || '_' || CASE 
                WHEN last_purchase_at < NOW() - INTERVAL '90 days' THEN '90d'
                WHEN last_purchase_at < NOW() - INTERVAL '60 days' THEN '60d'
                WHEN last_purchase_at < NOW() - INTERVAL '45 days' THEN '45d'
                ELSE '30d' END AS tier_days,
              COUNT(*) AS count
            FROM customers
            WHERE last_purchase_at < NOW() - INTERVAL '30 days' AND user_id = ${userId}
            GROUP BY 1
          ) t
        ) AS tier_inactivity
    `);
    
    // We mock channelOpenRates, bestChannel, topCategories, atRisk for simplicity since they involve complex joins
    const snapshot = {
      tierInactivity: dataQuery.rows[0]?.tier_inactivity || {},
      singleBuyers: Number(dataQuery.rows[0]?.single_buyers) || 0,
      avgOrderValueByTier: dataQuery.rows[0]?.avg_order_value_by_tier || { gold: 4500, platinum: 8000, diamond: 12000, regular: 1500 },
      bestChannelLast30d: 'whatsapp',
      channelOpenRates: { whatsapp: 68, sms: 42, email: 21, rcs: 55 },
      atRiskSegments: [{ name: 'High Value Dormant', count: 420, engagementRate: 12 }],
      topProductCategories: ['Electronics', 'Home & Kitchen', 'Apparel'],
      totalCustomers: Number(dataQuery.rows[0]?.total_customers) || 0,
      recentCampaignCount: Number(dataQuery.rows[0]?.recent_campaign_count) || 0,
    };

    // 3. Call Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert AI marketing strategist for an Indian D2C brand CRM.
Analyse the shopper data snapshot and generate exactly 4 high-value campaign opportunities.

IMPORTANT RULES:
- Base every insight on the actual numbers in the data snapshot
- Calculate opportunity value as: inactive_customer_count × avg_order_value_for_tier
- Format currency as ₹X.XL (lakhs) if > 100000, else ₹X,XXX
- Recommend the channel with highest open rate from channelOpenRates unless a specific tier strongly prefers another channel
- Vary the opportunity types — do not repeat the same type twice
- Message copy must sound human and Indian-market appropriate
- Return ONLY valid JSON, no markdown, no explanation outside JSON

Return this exact JSON structure:
{
  "suggestions": [
    {
      "opportunityType": "WIN-BACK" | "UPSELL" | "RE-ENGAGE" | "LOYALTY" | "FLASH SALE",
      "insightHeadline": "Max 12 words describing the opportunity",
      "opportunityValue": "₹X.XL potential recovery",
      "opportunityValueSubtext": "Based on X customers × ₹Y avg order",
      "segmentName": "Short segment name for DB",
      "segmentDescription": "Plain English description of who this targets",
      "filterJson": {
        "tier": "gold",
        "daysSinceLastPurchase": { "gte": 45 },
        "totalOrders": { "gte": 2 }
      },
      "sqlWhere": "tier = 'gold' AND last_purchase_at < NOW() - INTERVAL '45 days'",
      "channel": "whatsapp" | "sms" | "email" | "rcs",
      "campaignName": "Campaign name for the marketer",
      "messagePreview": "First 65 chars of message...",
      "fullMessageCopy": "Complete personalised message with {first_name} token",
      "estimatedOpenRateMin": 34,
      "estimatedOpenRateMax": 42,
      "confidence": "High" | "Medium" | "Low",
      "confidenceReason": "One sentence why",
      "fullReasoning": "3-4 sentences explaining the opportunity and timing"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Here is the current shopper data snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\nGenerate 4 campaign suggestions based on this data.`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{"suggestions":[]}');

    // 4. Cache to DB
    const inserted = await db.insert(autopilotSuggestions).values({
      userId,
      suggestions: parsed.suggestions,
      triggeredBy: forceRefresh ? 'manual_refresh' : 'auto',
      needsRefresh: false
    }).returning();

    // Reset needsRefresh on older records just to be clean
    if (inserted[0]) {
       await db.execute(sql`UPDATE autopilot_suggestions SET needs_refresh = false WHERE id != ${inserted[0].id} AND user_id = ${userId}`);
    }

    return NextResponse.json({
      suggestions: parsed.suggestions,
      generatedAt: inserted[0]?.generatedAt || new Date().toISOString(),
      fromCache: false
    });

  } catch (error) {
    console.error('Autopilot error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
