import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const since = req.nextUrl.searchParams.get('since');

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    let baseQuery = `
      SELECT 
        e.id,
        e.event_type   AS "eventType",
        e.channel,
        e.received_at  AS "receivedAt",
        e.metadata,
        c.name         AS "customerName",
        camp.name      AS "campaignName"
      FROM events e
      LEFT JOIN customers  c    ON e.customer_id  = c.id
      INNER JOIN campaigns camp ON e.campaign_id  = camp.id
      WHERE camp.user_id = '${userId}'
    `;

    if (since) {
      // Sanitise: only allow ISO timestamp strings
      const safeTs = String(since).replace(/[^0-9T:.\-Z]/g, '');
      baseQuery += ` AND e.received_at > '${safeTs}'::timestamptz`;
    }

    baseQuery += ` ORDER BY e.received_at DESC LIMIT 30`;

    const result = await db.execute(sql.raw(baseQuery));
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    return NextResponse.json({ events: rows });
  } catch (error) {
    console.error('[events/recent] error:', error);
    return NextResponse.json({ events: [] });
  }
}