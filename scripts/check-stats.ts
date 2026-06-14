import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkStats() {
  const stats = await db.execute(sql`SELECT total_sent, total_delivered, total_opened, total_clicked, total_order_placed, revenue_attributed FROM campaign_stats LIMIT 5`);
  const rows = Array.isArray(stats) ? stats : stats.rows;
  console.log('campaign_stats rows:', JSON.stringify(rows, null, 2));

  const campaigns = await db.execute(sql`SELECT id, name, status, total_recipients FROM campaigns LIMIT 5`);
  const campRows = Array.isArray(campaigns) ? campaigns : campaigns.rows;
  console.log('campaigns:', JSON.stringify(campRows, null, 2));

  const messages = await db.execute(sql`SELECT status, count(*) as cnt FROM messages GROUP BY status`);
  const msgRows = Array.isArray(messages) ? messages : messages.rows;
  console.log('messages by status:', JSON.stringify(msgRows, null, 2));

  const events = await db.execute(sql`SELECT event_type, count(*) as cnt FROM events GROUP BY event_type`);
  const evtRows = Array.isArray(events) ? events : events.rows;
  console.log('events by type:', JSON.stringify(evtRows, null, 2));
}

checkStats().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
