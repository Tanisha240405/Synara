import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, campaignStats, customers, segments, messages } from '@/lib/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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
    productId: body.productId || null,
    channel: body.channel,
    messageTemplate: body.messageTemplate,
    status: body.status || 'draft',
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
  }).returning();

  const campaign = inserted[0];

  // Fetch segment to get targets
  const [segment] = await db.select().from(segments).where(eq(segments.id, body.segmentId));
  let targets: any[] = [];
  if (segment && segment.sqlWhere) {
    const rawSql = `SELECT id FROM customers WHERE ${segment.sqlWhere}`;
    try {
      const result = await db.execute(sql.raw(rawSql));
      targets = Array.isArray(result) ? result : (result.rows || []);
    } catch (e) {
      console.error('Failed to fetch targets for campaign', e);
    }
  }

  // Fallback to all if no targets found or no segment
  if (targets.length === 0) {
    targets = await db.select({ id: customers.id }).from(customers);
  }

  // Create messages (recipients)
  if (targets.length > 0) {
    const messageBatch = targets.map((t: any) => ({
      campaignId: campaign.id,
      customerId: t.id,
      channel: campaign.channel,
      content: campaign.messageTemplate,
      status: 'pending',
    }));
    for (let j = 0; j < messageBatch.length; j += 100) {
      const chunk = messageBatch.slice(j, j + 100);
      await db.insert(messages).values(chunk);
    }
  }

  // Update total recipients
  await db.update(campaigns).set({ totalRecipients: targets.length }).where(eq(campaigns.id, campaign.id));

  // Initialize stats with zeros
  await db.insert(campaignStats).values({
    campaignId: campaign.id,
    totalSent: targets.length,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
  });

  // Invalidate autopilot cache
  try {
    await db.execute(sql`UPDATE autopilot_suggestions SET needs_refresh = true`);
  } catch (e) {
    console.error('Failed to invalidate autopilot cache', e);
  }

  // Start background simulation
  import('@/lib/simulator').then(({ simulateCampaignDelivery }) => {
    simulateCampaignDelivery(campaign.id);
  }).catch(e => console.error('Failed to start simulation', e));

  return NextResponse.json({ campaign });
}