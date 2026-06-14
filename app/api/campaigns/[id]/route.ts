import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, campaignStats, segments, products } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = params.id;

  const results = await db.select({
    campaign: campaigns,
    stats: campaignStats,
    segment: segments,
    product: products
  })
  .from(campaigns)
  .leftJoin(campaignStats, eq(campaigns.id, campaignStats.campaignId))
  .leftJoin(segments, eq(campaigns.segmentId, segments.id))
  .leftJoin(products, eq(campaigns.productId, products.id))
  .where(sql`campaigns.id = ${id} AND campaigns.user_id = ${session.user.id}`)
  .limit(1);

  if (results.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const result = results[0];
  
  return NextResponse.json({
    id: result.campaign.id,
    name: result.campaign.name,
    channel: result.campaign.channel,
    status: result.campaign.status,
    sentAt: result.campaign.sentAt,
    scheduledAt: result.campaign.scheduledAt,
    totalRecipients: result.campaign.totalRecipients,
    segmentName: result.segment?.name,
    productName: result.product?.name,
    stats: result.stats
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = params.id;
  
  // First delete stats to avoid foreign key constraints
  await db.delete(campaignStats).where(sql`campaign_id = ${id} AND EXISTS (SELECT 1 FROM campaigns WHERE id = ${id} AND user_id = ${session.user.id})`);
  // Then delete the campaign itself
  await db.delete(campaigns).where(sql`id = ${id} AND user_id = ${session.user.id}`);

  return NextResponse.json({ success: true });
}
