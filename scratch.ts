import { db } from './lib/db';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`SELECT id, name, sql_where FROM segments`);
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
