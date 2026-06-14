import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, messages } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('id');
    if (!campaignId) return NextResponse.json({ error: 'No ID' });

    const campaignArr = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    const campaign = campaignArr[0];

    let matchedCustomers = await db.execute(sql`SELECT id, name FROM customers LIMIT 10`);
    const customersList = Array.isArray(matchedCustomers) ? matchedCustomers : (matchedCustomers.rows || []);
    
    return NextResponse.json({ 
      campaign: campaign.name, 
      matchedCustomers: customersList.length,
      customersList: customersList.slice(0, 2)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  }
}
