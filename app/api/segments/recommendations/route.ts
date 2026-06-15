import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { aiChat } from '@/lib/ai/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ recommendations: [] }, { status: 401 });
    const userId = session.user.id;

    // Get quick stats to feed the AI
    const statsQuery = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        AVG(total_orders) as avg_orders
      FROM customers
      WHERE user_id = ${userId}
    `);
    
    const statsRows = Array.isArray(statsQuery) ? statsQuery : (statsQuery.rows || []);
    const stats = statsRows[0] || { total_users: 0, avg_orders: 0 };
    
    const [cityQuery, tierQuery, channelQuery] = await Promise.all([
      db.execute(sql`SELECT city, COUNT(*) as count FROM customers WHERE city IS NOT NULL AND user_id = ${userId} GROUP BY city ORDER BY count DESC LIMIT 3`),
      db.execute(sql`SELECT tier, COUNT(*) as count FROM customers WHERE tier IS NOT NULL AND user_id = ${userId} GROUP BY tier ORDER BY count DESC LIMIT 2`),
      db.execute(sql`SELECT channel_preference as channel, COUNT(*) as count FROM customers WHERE channel_preference IS NOT NULL AND user_id = ${userId} GROUP BY channel_preference ORDER BY count DESC LIMIT 2`)
    ]);

    const getValues = (query: any, key: string) => (Array.isArray(query) ? query : query.rows || []).map((r: Record<string, unknown>) => r[key]).join(', ');
    
    const topCities = getValues(cityQuery, 'city') || 'Delhi, Mumbai';
    const topTiers = getValues(tierQuery, 'tier') || 'Gold, Platinum';
    const topChannels = getValues(channelQuery, 'channel') || 'WhatsApp, Email';

    const prompt = `You are a CRM expert. Generate 3 creative, actionable, and data-driven segment queries (in plain English) that the user could use to build a campaign. 
They should be 1 sentence each. 
CRITICAL: To ensure these queries match actual data, you MUST ONLY use the following specific values if you mention these fields:
- Cities: ${topCities}
- Tiers: ${topTiers}
- Channels: ${topChannels}

IMPORTANT RULE: The database only has 500 mock users. To avoid generating empty segments (0 matches), keep the queries BROAD. Do NOT combine more than TWO criteria. For example, use only City, or only Tier + Channel. Do not combine City, Tier, and Channel together.

Example: "${topTiers.split(',')[0] || 'Gold'} customers" or "Users in ${topCities.split(',')[0] || 'Delhi'} who prefer ${topChannels.split(',')[0] || 'WhatsApp'}"

Respond ONLY with a JSON array of strings. No markdown. Example: ["segment 1", "segment 2", "segment 3"]`;

    const data = await aiChat({
      messages: [{ role: 'user', content: prompt }]
    });

    const content = data.choices[0].message.content || '[]';
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json({ recommendations: result });
  } catch (error) {
    console.error('Failed to generate segment recommendations:', error);
    // Fallback recommendations if AI fails
    return NextResponse.json({ 
      recommendations: [
        "High value customers who prefer WhatsApp",
        "Recent purchasers with a high churn risk",
        "Gold tier members with more than 5 orders"
      ] 
    });
  }
}
