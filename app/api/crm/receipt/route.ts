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
      await db.execute(sql`
        INSERT INTO campaign_stats (campaign_id, ${sql.raw(colName)}${eventType === 'order_placed' ? sql.raw(', revenue_attributed') : sql.raw('')})
        VALUES (${campaignId}, 1${eventType === 'order_placed' ? sql.raw(`, ${revenue}`) : sql.raw('')})
        ON CONFLICT (campaign_id) DO UPDATE SET
          ${sql.raw(colName)} = campaign_stats.${sql.raw(colName)} + 1,
          updated_at = NOW()
          ${eventType === 'order_placed' ? sql.raw(`, revenue_attributed = campaign_stats.revenue_attributed + ${revenue}`) : sql.raw('')}
      `);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}