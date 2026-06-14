import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
export async function GET() {
  const result = await db.execute(sql`SELECT name, total_recipients FROM campaigns`);
  return NextResponse.json(result);
}
