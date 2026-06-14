import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const dbUser = await db.select({ industrySegment: users.industrySegment }).from(users).where(eq(users.id, userId)).limit(1);
  const industrySegment = dbUser[0]?.industrySegment;

  const results = await db.select().from(products)
    .where(sql`(user_id = ${userId} OR user_id IS NULL) ${industrySegment ? sql`AND (industry_segment = ${industrySegment} OR industry_segment IS NULL)` : sql``}`)
    .orderBy(desc(products.createdAt));

  return NextResponse.json({ products: results });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const dbUser = await db.select({ industrySegment: users.industrySegment }).from(users).where(eq(users.id, userId)).limit(1);
  const industrySegment = dbUser[0]?.industrySegment;

  const { name, category, price } = await req.json();

  if (!name || !price) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const [newProduct] = await db.insert(products).values({
    id: crypto.randomUUID(),
    userId,
    name,
    category: category || 'General',
    price: price.toString(),
    industrySegment,
    isMockData: false,
  }).returning();

  return NextResponse.json({ product: newProduct });
}
