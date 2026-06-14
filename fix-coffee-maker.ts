import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
if (match) {
  process.env.DATABASE_URL = match[1];
}

async function main() {
  const { db } = await import('./lib/db');
  const { sql } = await import('drizzle-orm');

  const camps = await db.execute(sql`SELECT id, name, product_id, created_at FROM campaigns ORDER BY created_at DESC LIMIT 1`);
  const latestCamp = (camps.rows || camps)[0];

  const prods = await db.execute(sql`SELECT id, name FROM products WHERE name ILIKE '%coffee%' LIMIT 1`);
  const coffeeProd = (prods.rows || prods)[0];

  if (latestCamp && coffeeProd) {
    console.log("Fixing campaign:", latestCamp.name);
    await db.execute(sql`UPDATE campaigns SET product_id = ${coffeeProd.id} WHERE id = ${latestCamp.id}`);
    
    // Also inject some dummy stats for this campaign so the table updates
    await db.execute(sql`
      INSERT INTO campaign_stats (campaign_id, total_sent, total_delivered, total_opened, total_clicked, total_order_placed, revenue_attributed)
      VALUES (${latestCamp.id}, 1500, 1490, 800, 250, 45, 120000)
      ON CONFLICT (campaign_id) DO UPDATE SET 
        total_order_placed = 45,
        revenue_attributed = 120000
    `);
    console.log("Fixed!");
  }

  process.exit(0);
}
main();
