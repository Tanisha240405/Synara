import { db } from './lib/db';
import { campaigns, messages } from './lib/schema';
import { eq, sql } from 'drizzle-orm';

async function run() {
  const camps = await db.select().from(campaigns).where(eq(campaigns.name, 'Diwali Mega Sale'));
  if (!camps.length) return console.log('no camp');
  const campaign = camps[0];
  
  console.log('Found campaign', campaign.id);
  
  const matchedCustomers = await db.execute(sql`SELECT id, name FROM customers LIMIT 10`);
  const customersList = Array.isArray(matchedCustomers) ? matchedCustomers : (matchedCustomers.rows || []);
  
  const msgs = customersList.map((c: any) => ({
    campaignId: campaign.id,
    customerId: c.id,
    channel: campaign.channel,
    content: campaign.messageTemplate.replace('{first_name}', c.name.split(' ')[0]),
  }));
  
  console.log('msgs length', msgs.length);
  
  try {
    const res = await db.insert(messages).values(msgs).returning({ id: messages.id });
    console.log('inserted', res.length);
  } catch (e: any) {
    console.error('INSERT ERROR', e.message);
  }
  process.exit(0);
}
run();
