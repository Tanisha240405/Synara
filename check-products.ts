import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const topProductsQuery = await db.execute(sql`
    SELECT 
      p.id, p.name, p.price, p.category,
      COUNT(DISTINCT c.id)::int        AS "campaignCount",
      COALESCE(SUM(cs.total_sent), 0)::int         AS "totalSent",
      COALESCE(SUM(cs.total_order_placed), 0)::int AS "totalConversions"
    FROM products p
    JOIN campaigns c ON p.id = c.product_id
    JOIN campaign_stats cs ON c.id = cs.campaign_id
    GROUP BY p.id, p.name, p.price, p.category
    ORDER BY "totalConversions" DESC
    LIMIT 5
  `);
  console.log("Top Products:", topProductsQuery.rows || topProductsQuery);
  
  const allProducts = await db.execute(sql`SELECT COUNT(*) FROM products`);
  console.log("Total products:", allProducts.rows || allProducts);
  
  const campsWithProducts = await db.execute(sql`SELECT COUNT(*) FROM campaigns WHERE product_id IS NOT NULL`);
  console.log("Camps with products:", campsWithProducts.rows || campsWithProducts);
  
  process.exit(0);
}
main();
