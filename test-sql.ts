import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

async function main() {
  const { db } = await import('./lib/db');
  const { sql } = await import('drizzle-orm');
  
  try {
    const msgStatsQuery = await db.execute(sql`
      SELECT 
        COUNT(*)::int AS "totalSent",
        SUM(CASE WHEN status IN ('delivered', 'opened', 'clicked', 'order_placed', 'converted') THEN 1 ELSE 0 END)::int AS "totalDelivered",
        SUM(CASE WHEN status IN ('opened', 'clicked', 'order_placed', 'converted') THEN 1 ELSE 0 END)::int AS "totalOpened",
        SUM(CASE WHEN status IN ('clicked', 'order_placed', 'converted') THEN 1 ELSE 0 END)::int AS "totalClicked",
        SUM(CASE WHEN status IN ('order_placed', 'converted') THEN 1 ELSE 0 END)::int AS "totalConversions"
      FROM messages
    `);
    console.log("SUCCESS", msgStatsQuery.rows);
  } catch (err) {
    console.log("ERROR", err);
  }
  process.exit(0);
}

main();
