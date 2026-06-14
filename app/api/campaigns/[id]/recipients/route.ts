import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, customers } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = params.id;
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');
  const search = url.searchParams.get('search')?.toLowerCase();
  
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let conditions = [eq(messages.campaignId, id)];
  
  if (statusFilter && statusFilter !== 'all') {
    conditions.push(eq(messages.status, statusFilter));
  }
  
  if (search) {
    conditions.push(sql`LOWER(${customers.name}) LIKE ${'%' + search + '%'}`);
  }

  const whereClause = and(...conditions);

  const data = await db.select({
    id: messages.id,
    status: messages.status,
    sentAt: messages.sentAt,
    channel: messages.channel,
    customer: {
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone
    }
  })
  .from(messages)
  .leftJoin(customers, eq(messages.customerId, customers.id))
  .where(whereClause)
  .orderBy(sql`CASE ${messages.status} WHEN 'converted' THEN 1 WHEN 'clicked' THEN 2 WHEN 'opened' THEN 3 WHEN 'delivered' THEN 4 WHEN 'failed' THEN 5 ELSE 6 END, ${messages.sentAt} DESC NULLS LAST`)
  .limit(limit)
  .offset(offset);

  // Count total for pagination
  const countQuery = await db.select({ count: sql<number>`count(*)` })
    .from(messages)
    .leftJoin(customers, eq(messages.customerId, customers.id))
    .where(whereClause);
    
  const total = countQuery[0].count;

  return NextResponse.json({
    recipients: data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
}
