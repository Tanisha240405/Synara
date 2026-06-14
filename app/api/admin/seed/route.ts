import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, customers } from '@/lib/schema';
import bcrypt from 'bcryptjs';
import { fakerEN_IN as faker } from '@faker-js/faker';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pass = await bcrypt.hash('Synara@2026!', 10);
    await db.insert(users).values({
      id: faker.string.uuid(),
      name: 'Demo User',
      email: 'demo@synara.ai',
      password: pass
    }).onConflictDoNothing();

    const custs = [];
    for(let i=0; i<500; i++) {
      const r = Math.random();
      let tier = 'regular';
      let spend = faker.number.int({min: 500, max: 5000});
      if (r > 0.5) { tier = 'gold'; spend = faker.number.int({min: 5000, max: 15000}); }
      if (r > 0.8) { tier = 'platinum'; spend = faker.number.int({min: 15000, max: 50000}); }
      if (r > 0.95) { tier = 'diamond'; spend = faker.number.int({min: 50000, max: 200000}); }
      
      const r2 = Math.random();
      let pref = 'whatsapp';
      if(r2 > 0.45) pref = 'sms';
      if(r2 > 0.70) pref = 'email';
      if(r2 > 0.90) pref = 'rcs';

      custs.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: '+91' + faker.string.numeric(10),
        channelPreference: pref,
        tier,
        totalOrders: faker.number.int({min: 0, max: 10}),
        totalSpend: spend.toString(),
        ltv: (spend * 1.5).toString(),
        city: faker.helpers.arrayElement(['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune'])
      });
    }
    await db.insert(customers).values(custs);

    return NextResponse.json({ ok: true, message: 'Seeded successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
