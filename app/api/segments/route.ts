import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { segments } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const custQuery = await db.execute(sql`SELECT COUNT(*) as count FROM customers WHERE user_id = ${userId}`);
  const custRows = Array.isArray(custQuery) ? custQuery : (custQuery.rows || []);
  const hasData = parseInt(String(custRows[0]?.count || '0')) > 0;

  const data = await db.select().from(segments)
    .where(eq(segments.userId, userId))
    .orderBy(desc(segments.createdAt));

  // Refresh each segment's customer_count live so it reflects any customers
  // added after the segment was originally created (mock-data, seed, imports).
  const refreshed = await Promise.all(data.map(async (seg) => {
    try {
      const rawSql = seg.sqlWhere || '1=1';
      const countQuery = await db.execute(
        sql`SELECT COUNT(*) as count FROM customers WHERE user_id = ${userId} AND (${sql.raw(rawSql)})`
      );
      const countRows = Array.isArray(countQuery) ? countQuery : (countQuery.rows || []);
      const liveCount = parseInt(String(countRows[0]?.count || '0'));

      // Persist updated count back to DB if it changed
      if (liveCount !== seg.customerCount) {
        await db.update(segments)
          .set({ customerCount: liveCount })
          .where(eq(segments.id, seg.id));
      }
      return { ...seg, customerCount: liveCount };
    } catch {
      // If the sqlWhere is invalid, return the stored count rather than crashing
      return seg;
    }
  }));

  // Only return segments with at least 1 customer
  const visible = refreshed.filter(s => (s.customerCount ?? 0) > 0);

  return NextResponse.json({ segments: visible, hasData });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  let actualCount = 0;
  
  try {
    const rawSql = body.sqlWhere || '1=1';
    const countQuery = await db.execute(sql`SELECT COUNT(*) as count FROM customers WHERE user_id = ${userId} AND (${sql.raw(rawSql)})`);
    const countRows = Array.isArray(countQuery) ? countQuery : (countQuery.rows || []);
    actualCount = parseInt(String(countRows[0]?.count || '0'));
  } catch (e) {
    console.error('Error calculating segment count:', e);
    return NextResponse.json({ error: 'Invalid segment query' }, { status: 400 });
  }

  if (actualCount === 0) {
    return NextResponse.json({ error: 'Cannot create segment: No shoppers match this criteria.' }, { status: 400 });
  }

  const inserted = await db.insert(segments).values({
    userId,
    name: body.name,
    naturalLanguageQuery: body.naturalLanguageQuery,
    filterJson: body.filterJson || {},
    sqlWhere: body.sqlWhere || '1=1',
    isAiGenerated: !!body.naturalLanguageQuery,
    aiConfidence: body.confidence || 0,
    customerCount: actualCount
  }).returning();
  
  return NextResponse.json(inserted[0]);
}