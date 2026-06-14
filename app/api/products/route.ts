import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.select({ industrySegment: users.industrySegment }).from(users).where(eq(users.email, session.user.email)).limit(1);
  const industrySegment = dbUser[0]?.industrySegment;

  const results = industrySegment 
    ? await db.select().from(products).where(eq(products.industrySegment, industrySegment)).orderBy(desc(products.createdAt))
    : await db.select().from(products).orderBy(desc(products.createdAt));

  return NextResponse.json({ products: results });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.select({ industrySegment: users.industrySegment }).from(users).where(eq(users.email, session.user.email)).limit(1);
  const industrySegment = dbUser[0]?.industrySegment;

  const { name, category, price } = await req.json();

  if (!name || !price) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const [newProduct] = await db.insert(products).values({
    id: crypto.randomUUID(),
    name,
    category: category || 'General',
    price: price.toString(),
    industrySegment,
    isMockData: false,
  }).returning();

  return NextResponse.json({ product: newProduct });
}
