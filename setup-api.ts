import fs from 'fs';
import path from 'path';

const files = {
  'app/api/crm/receipt/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events, messages, campaignStats, campaigns } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { eventType, messageId, campaignId, customerId, channel } = body;

    await db.insert(events).values({
      messageId, campaignId, customerId, eventType, channel,
    });

    const terminalStatuses = ['delivered', 'opened', 'clicked', 'order_placed', 'failed'];
    if (terminalStatuses.includes(eventType)) {
      await db.update(messages).set({ status: eventType }).where(eq(messages.id, messageId));
    } else if (eventType === 'sent') {
      await db.update(messages).set({ status: 'sent', sentAt: new Date() }).where(eq(messages.id, messageId));
    }

    let revenue = 0;
    if (eventType === 'order_placed') {
      revenue = Math.floor(Math.random() * (5000 - 500 + 1) + 500);
    }

    const fieldMap: Record<string, string> = {
      'sent': 'totalSent',
      'delivered': 'totalDelivered',
      'failed': 'totalFailed',
      'opened': 'totalOpened',
      'clicked': 'totalClicked',
      'order_placed': 'totalOrderPlaced'
    };
    const colName = fieldMap[eventType];
    
    if (colName) {
      await db.execute(sql\`
        INSERT INTO campaign_stats (campaign_id, \${sql.raw(colName)}\${eventType === 'order_placed' ? sql.raw(', revenue_attributed') : sql.raw('')})
        VALUES (\${campaignId}, 1\${eventType === 'order_placed' ? sql.raw(\`, \${revenue}\`) : sql.raw('')})
        ON CONFLICT (campaign_id) DO UPDATE SET
          \${sql.raw(colName)} = campaign_stats.\${sql.raw(colName)} + 1,
          updated_at = NOW()
          \${eventType === 'order_placed' ? sql.raw(\`, revenue_attributed = campaign_stats.revenue_attributed + \${revenue}\`) : sql.raw('')}
      \`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
`,
  'app/api/channel/send/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { simulateDelivery } from '@/lib/channel-simulator';
import { waitUntil } from '@vercel/functions';

export async function POST(req: NextRequest) {
  try {
    const { messageId, customerId, campaignId, channel } = await req.json();
    waitUntil(simulateDelivery(messageId, campaignId, customerId, channel));
    return NextResponse.json({ dispatched: true }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
`,
  'app/api/campaigns/[id]/send/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, segments, messages, customers } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { waitUntil } from '@vercel/functions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const campaignId = params.id;
  const campaignArr = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!campaignArr.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const campaign = campaignArr[0];

  await db.update(campaigns).set({ status: 'sending', sentAt: new Date() }).where(eq(campaigns.id, campaignId));

  const segmentArr = await db.select().from(segments).where(eq(segments.id, campaign.segmentId!));
  const segment = segmentArr[0];

  const matchedCustomers = await db.execute(sql\`SELECT id, name FROM customers WHERE \${sql.raw(segment.sqlWhere!)}\`);
  const total = matchedCustomers.length;

  await db.update(campaigns).set({ totalRecipients: total }).where(eq(campaigns.id, campaignId));

  const msgs = matchedCustomers.map((c: any) => ({
    campaignId,
    customerId: c.id,
    channel: campaign.channel,
    content: campaign.messageTemplate.replace('{first_name}', c.name.split(' ')[0]),
  }));
  
  if (msgs.length > 0) {
    const inserted = await db.insert(messages).values(msgs).returning({ id: messages.id, customerId: messages.customerId });
    
    // Dispatch to channel API
    const dispatchAll = async () => {
      for (const msg of inserted) {
        await fetch(\`\${process.env.NEXT_PUBLIC_APP_URL}/api/channel/send\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: msg.id, customerId: msg.customerId, campaignId, channel: campaign.channel })
        });
      }
    };
    waitUntil(dispatchAll());
  }

  return NextResponse.json({ dispatched: total }, { status: 202 });
}
`,
  'app/api/ai/chat/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { groq, GROQ_MODEL } from '@/lib/groq';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages, context } = await req.json();

  const systemPrompt = \`You are XenoAI, the intelligent marketing assistant inside XenoReach CRM for Indian consumer brands.
Live data context: \${JSON.stringify(context || {})}
Your capabilities:
1. Analyse campaign performance and explain what the data means
2. Suggest which segment to target and why
3. Draft campaign messages in the right tone
4. Identify at-risk or high-value customers
5. Recommend next best actions based on current data
Guidelines:
- Be concise: 2-4 sentences unless asked for detail
- Always ground recommendations in the actual data provided
- Use ₹ for Indian currency amounts
- When suggesting a campaign, mention the expected audience size
- If data is insufficient to answer, say so clearly and suggest what data would help
- You can perform actions: when user says "create segment" or "launch campaign", 
  end your response with a JSON action block:
  {"action": "create_segment", "params": {"name": "...", "query": "..."}}
  or {"action": "draft_campaign", "params": {"segmentId": "...", "channel": "whatsapp", "goal": "..."}}\`;

  try {
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(\`data: \${JSON.stringify({ content })}\\n\\n\`));
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\\n\\n'));
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
`,
  'app/api/ai/segment/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { groq, GROQ_MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const prompt = \`You are a PostgreSQL expert for an Indian consumer brand CRM.
Convert this audience description to a SQL WHERE clause for the customers table.
Available columns:
- name (text), email (text), phone (text)
- channel_preference (text: 'whatsapp'|'sms'|'email'|'rcs')
- tier (text: 'regular'|'gold'|'platinum'|'diamond')
- total_orders (integer), total_spend (decimal, in INR), ltv (decimal, in INR)
- last_purchase_at (timestamp), last_engaged_at (timestamp), churn_risk (decimal 0-100), city (text), created_at (timestamp)

Query: "\${query}"

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "segmentName": "Short 3-5 word name",
  "sqlWhere": "tier = 'gold' AND total_orders >= 2",
  "filterJson": {},
  "confidence": 94.5,
  "reasoning": "One sentence explanation"
}\`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });
    
    const content = response.choices[0].message.content || '{}';
    const jsonStr = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const result = JSON.parse(jsonStr);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate segment' }, { status: 500 });
  }
}
`,
  'app/api/segments/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { segments } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const data = await db.select().from(segments).orderBy(desc(segments.createdAt));
  return NextResponse.json({ segments: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const inserted = await db.insert(segments).values({
    name: body.name,
    naturalLanguageQuery: body.naturalLanguageQuery,
    filterJson: body.filterJson || {},
    sqlWhere: body.sqlWhere || '1=1',
    isAiGenerated: !!body.naturalLanguageQuery,
    aiConfidence: body.confidence || 0,
    customerCount: body.customerCount || 0
  }).returning();
  return NextResponse.json(inserted[0]);
}
`,
  'app/api/campaigns/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, campaignStats } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  const camps = await db.select({
    campaign: campaigns,
    stats: campaignStats
  })
  .from(campaigns)
  .leftJoin(campaignStats, eq(campaigns.id, campaignStats.campaignId))
  .orderBy(desc(campaigns.createdAt));
  
  return NextResponse.json({ campaigns: camps.map(c => ({ ...c.campaign, stats: c.stats })) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const inserted = await db.insert(campaigns).values({
    name: body.name,
    segmentId: body.segmentId,
    channel: body.channel,
    messageTemplate: body.messageTemplate,
    status: 'draft',
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
  }).returning();
  return NextResponse.json(inserted[0]);
}
`,
  'app/api/analytics/dashboard/route.ts': `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  const statsQuery = await db.execute(sql\`
    SELECT 
      SUM(total_sent) as "totalSent",
      SUM(total_delivered) as "totalDelivered",
      SUM(total_opened) as "totalOpened",
      SUM(total_order_placed) as "totalConversions",
      SUM(revenue_attributed) as "revenue"
    FROM campaign_stats
  \`);
  
  const campsQuery = await db.execute(sql\`
    SELECT COUNT(*) as active FROM campaigns WHERE status IN ('sending', 'scheduled')
  \`);
  
  const row = statsQuery[0] || {};
  const totalSent = parseInt(row.totalSent) || 0;
  const totalDelivered = parseInt(row.totalDelivered) || 0;
  const totalOpened = parseInt(row.totalOpened) || 0;
  
  return NextResponse.json({
    totalSent,
    totalDelivered,
    avgOpenRate: totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : 0,
    totalConversions: parseInt(row.totalConversions) || 0,
    activeCampaigns: parseInt(campsQuery[0]?.active || 0),
    predictedLtv: 4500,
    currentLtv: 3200,
    churnRate: 12.5,
    aov: 1250
  });
}
`,
  'app/api/analytics/events/recent/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since');
  let query = sql\`
    SELECT e.id, e.event_type as "eventType", e.channel, e.received_at as "receivedAt",
           c.name as "customerName", camp.name as "campaignName"
    FROM events e
    JOIN customers c ON e.customer_id = c.id
    JOIN campaigns camp ON e.campaign_id = camp.id
  \`;
  
  if (since) {
    query = sql\`\${query} WHERE e.received_at > \${since}::timestamp\`;
  }
  query = sql\`\${query} ORDER BY e.received_at DESC LIMIT 20\`;
  
  const eventsList = await db.execute(query);
  return NextResponse.json({ events: eventsList });
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim());
}
console.log('APIs generated');
