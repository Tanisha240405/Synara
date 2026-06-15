import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, campaignStats } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groq } from '@/lib/groq';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    // Fetch active/sending campaigns and their stats
    const activeCampaigns = await db.execute(sql`
      SELECT c.name, c.status, c.channel, s.total_sent, s.total_delivered, s.total_opened, s.total_clicked, s.total_order_placed, s.revenue_attributed
      FROM campaigns c
      LEFT JOIN campaign_stats s ON c.id = s.campaign_id
      WHERE c.user_id = ${userId} AND c.status IN ('sending', 'completed')
      ORDER BY c.created_at DESC
      LIMIT 3
    `);

    if (activeCampaigns.rowCount === 0) {
      return NextResponse.json({
        insight: null
      });
    }

    const campaignDataStr = JSON.stringify(activeCampaigns.rows, null, 2);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert AI marketing analyst. You are analyzing live or recent campaign data.
Generate exactly 1 actionable insight/opportunity based on the provided campaign data.
Return ONLY valid JSON.

JSON format:
{
  "insight": "Your 'Summer Sale' campaign is seeing a 40% open rate on WhatsApp. We recommend pushing an immediate follow-up to the remaining un-opened audience via SMS.",
  "actionText": "Shift to SMS",
  "successMessage": "Budget shifted to SMS successfully."
}`
        },
        {
          role: "user",
          content: `Here is the recent campaign data:\n${campaignDataStr}\n\nGenerate one AI Optimization Opportunity.`
        }
      ]
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{"insight": null}');

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Campaign insight error:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
