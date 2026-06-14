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
  const result = await db.execute(sql`SELECT status, COUNT(*) FROM messages GROUP BY status`);
  console.log("MESSAGES BY STATUS:", result.rows);
  process.exit(0);
}

main();
