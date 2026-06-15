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

  let matchedCustomers: any;
  try {
    if (campaign.segmentId) {
      const segmentArr = await db.select().from(segments).where(eq(segments.id, campaign.segmentId));
      const segment = segmentArr[0];
      if (segment && segment.sqlWhere) {
        matchedCustomers = await db.execute(sql`SELECT id, name FROM customers WHERE (${sql.raw(segment.sqlWhere)}) AND user_id = ${session.user.id}`);
      }
    }
  } catch (e) {
    console.error('Error fetching segment or customers:', e);
  }

  if (!matchedCustomers) {
    // Fallback to all customers for THIS USER if no segment or sqlWhere, or if query failed
    matchedCustomers = await db.execute(sql`SELECT id, name FROM customers WHERE user_id = ${session.user.id}`);
  }

  const total = Array.isArray(matchedCustomers) ? matchedCustomers.length : (matchedCustomers.rowCount || 0);

  await db.update(campaigns).set({ totalRecipients: total }).where(eq(campaigns.id, campaignId));

  try {
    await db.execute(sql`
      INSERT INTO campaign_stats (campaign_id, total_sent, total_delivered, total_opened, total_clicked, total_failed, total_order_placed, revenue_attributed)
      VALUES (${campaignId}, 0, 0, 0, 0, 0, 0, 0)
      ON CONFLICT (campaign_id) DO NOTHING
    `);
  } catch (e) {
    console.error('Failed to init campaign stats', e);
  }

  const customersList = Array.isArray(matchedCustomers) ? matchedCustomers : (matchedCustomers.rows || []);
  const msgs = customersList.map((c: any) => ({
    campaignId,
    customerId: c.id,
    channel: campaign.channel,
    content: campaign.messageTemplate.replace('{first_name}', c.name.split(' ')[0]),
  }));
  
  if (msgs.length > 0) {
    const inserted: any[] = [];
    for (let j = 0; j < msgs.length; j += 100) {
      const chunk = msgs.slice(j, j + 100);
      const res = await db.insert(messages).values(chunk).returning({ id: messages.id, customerId: messages.customerId });
      inserted.push(...res);
    }
    
    const protocol = req.headers.get('host')?.includes('localhost') ? 'http' : 'https';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get('host') ? `${protocol}://${req.headers.get('host')}` : 'http://localhost:3000');
    // Dispatch to channel API
    const dispatchAll = async () => {
      try {
        for (const msg of inserted) {
          try {
            await fetch(`${appUrl}/api/channel/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageId: msg.id, customerId: msg.customerId, campaignId, channel: campaign.channel })
            });
          } catch (e) {
            console.error('Failed to dispatch message', e);
          }
        }
      } catch (e) {
        console.error('Fatal error in dispatchAll', e);
      }
    };
    waitUntil(dispatchAll());
  }

  return NextResponse.json({ dispatched: total }, { status: 202 });
}