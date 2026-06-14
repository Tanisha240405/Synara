import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { segments } from '@/lib/schema';
import { desc } from 'drizzle-orm';

import { sql } from 'drizzle-orm';

export async function GET() {
  const custQuery = await db.execute(sql`SELECT COUNT(*) as count FROM customers`);
  const custRows = Array.isArray(custQuery) ? custQuery : (custQuery.rows || []);
  const hasData = parseInt(String(custRows[0]?.count || '0')) > 0;

  const data = await db.select().from(segments)
    .where(sql`customer_count > 0`)
    .orderBy(desc(segments.createdAt));
  
  return NextResponse.json({ segments: data, hasData });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  let actualCount = 0;
  
  try {
    const rawSql = body.sqlWhere || '1=1';
    const countQuery = await db.execute(sql`SELECT COUNT(*) as count FROM customers WHERE ${sql.raw(rawSql)}`);
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