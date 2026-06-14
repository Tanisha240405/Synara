
import { db } from '../lib/db';
import { users } from '../lib/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Updating password...');
  const pass = await bcrypt.hash('Synara@2026!', 10);
  
  await db.update(users)
    .set({ password: pass })
    .where(eq(users.email, 'demo@synara.ai'));

  console.log('Update complete!');
  process.exit(0);
}

main().catch(console.error);
