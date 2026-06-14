import { db } from './db';
import { customers } from './schema';
import { sql } from 'drizzle-orm';

export async function hasData() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(customers);
  return Number(result[0].count) > 0;
}
