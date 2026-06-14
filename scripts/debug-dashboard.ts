// Debug script to simulate what the dashboard API returns
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function debugDashboard() {
  // Step 1: hasData check
  const custQuery = await db.execute(sql`SELECT COUNT(*) as count FROM customers`);
  const custRows = Array.isArray(custQuery) ? custQuery : (custQuery.rows || []);
  console.log('custRows[0]:', JSON.stringify(custRows[0]));
  const hasData = parseInt(custRows[0]?.count || 0) > 0;
  console.log('hasData:', hasData);

  if (!hasData) {
    console.log('❌ hasData is false — will return all zeros');
    return;
  }

  // Step 2: stats query
  const statsQuery = await db.execute(sql`
    SELECT 
      SUM(total_sent) as "totalSent",
      SUM(total_delivered) as "totalDelivered",
      SUM(total_opened) as "totalOpened",
      SUM(total_clicked) as "totalClicked",
      SUM(total_order_placed) as "totalConversions",
      SUM(revenue_attributed) as "revenue"
    FROM campaign_stats
  `);
  const statsRows = Array.isArray(statsQuery) ? statsQuery : (statsQuery.rows || []);
  console.log('statsRows[0]:', JSON.stringify(statsRows[0]));
  
  const row = statsRows[0] || {};
  console.log('Parsed totalSent:', parseInt(row.totalSent));
  console.log('Parsed totalDelivered:', parseInt(row.totalDelivered));
  console.log('Parsed avgOpenRate:', statsRows[0]?.totalDelivered > 0 ? ((parseInt(row.totalOpened) / parseInt(row.totalDelivered)) * 100).toFixed(1) : 0);
}

debugDashboard().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
