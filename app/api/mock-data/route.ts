import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, customers, orders, products, campaigns, campaignStats, segments, messages, events } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { fakerEN_IN as faker } from '@faker-js/faker';

const INDUSTRY_PRODUCTS = {
  'apparel': [
    { name: 'Cotton T-Shirt', category: 'Apparel', price: '799' },
    { name: 'Running Shoes', category: 'Footwear', price: '2999' },
    { name: 'Denim Jeans', category: 'Apparel', price: '1499' },
    { name: 'Summer Dress', category: 'Apparel', price: '1999' },
    { name: 'Leather Jacket', category: 'Apparel', price: '4999' },
    { name: 'Sneakers', category: 'Footwear', price: '3499' },
    { name: 'Backpack', category: 'Accessories', price: '1299' },
  ],
  'beauty': [
    { name: 'Matte Lipstick', category: 'Makeup', price: '499' },
    { name: 'Hydrating Serum', category: 'Skincare', price: '899' },
    { name: 'Vitamin C Cream', category: 'Skincare', price: '699' },
    { name: 'Foundation', category: 'Makeup', price: '1200' },
    { name: 'Body Lotion', category: 'Body Care', price: '350' },
    { name: 'Sunscreen SPF 50', category: 'Skincare', price: '450' },
  ],
  'electronics': [
    { name: 'Wireless Earbuds', category: 'Audio', price: '2499' },
    { name: 'Smart Watch', category: 'Wearables', price: '4999' },
    { name: 'Bluetooth Speaker', category: 'Audio', price: '3499' },
    { name: 'Power Bank 10000mAh', category: 'Accessories', price: '999' },
    { name: 'Fast Charger 65W', category: 'Accessories', price: '1499' },
    { name: 'Gaming Mouse', category: 'Peripherals', price: '1299' },
  ],
  'fmcg': [
    { name: 'Organic Green Tea', category: 'Beverages', price: '250' },
    { name: 'Whole Wheat Bread', category: 'Bakery', price: '50' },
    { name: 'Almond Milk 1L', category: 'Dairy', price: '300' },
    { name: 'Mixed Nuts 500g', category: 'Snacks', price: '650' },
    { name: 'Laundry Detergent 2kg', category: 'Household', price: '450' },
    { name: 'Olive Oil 1L', category: 'Pantry', price: '850' },
  ],
  'other': [
    { name: 'Desk Lamp', category: 'Home Goods', price: '999' },
    { name: 'Yoga Mat', category: 'Fitness', price: '899' },
    { name: 'Coffee Maker', category: 'Home Goods', price: '5499' },
    { name: 'Water Bottle', category: 'Accessories', price: '499' },
    { name: 'Notebook Set', category: 'Stationery', price: '299' },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await db.select({ industrySegment: users.industrySegment }).from(users).where(eq(users.email, session.user.email)).limit(1);
    const industrySegment = dbUser[0]?.industrySegment;

    if (!industrySegment || !INDUSTRY_PRODUCTS[industrySegment as keyof typeof INDUSTRY_PRODUCTS]) {
      return NextResponse.json({ error: 'Valid industry segment required to generate data' }, { status: 400 });
    }

    const userId = session.user.id as string;
    
    // Existing mock data is no longer cleared here, allowing new mock data to stack
    // Products are reused if they already exist for this user.

    // 1. Fetch or Generate Products
    const productSeeds = INDUSTRY_PRODUCTS[industrySegment as keyof typeof INDUSTRY_PRODUCTS];
    let generatedProducts = await db.select().from(products).where(sql`is_mock_data = true AND user_id = ${userId}`);
    
    if (generatedProducts.length === 0) {
      for (const p of productSeeds) {
        const [{ insertedId }] = await db.insert(products).values({
          id: faker.string.uuid(),
          userId,
          name: p.name,
          category: p.category,
          price: p.price,
          industrySegment,
          isMockData: true,
        }).returning({ insertedId: products.id });
        generatedProducts.push({ ...p, id: insertedId } as any);
      }
    }

    // 3. Generate Customers
    const customerCount = faker.number.int({ min: 1900, max: 2100 });
    const generatedCustomers = [];
    
    // Batch insert customers
    const customerBatch = [];
    for (let i = 0; i < customerCount; i++) {
      const tierRandom = Math.random();
      const tier = tierRandom > 0.8 ? 'gold' : tierRandom > 0.5 ? 'silver' : 'bronze';
      
      const customer = {
        id: faker.string.uuid(),
        userId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        channelPreference: faker.helpers.arrayElement(['whatsapp', 'sms', 'email']),
        tier,
        city: faker.location.city(),
        isMockData: true,
        createdAt: faker.date.past({ years: 2 }),
      };
      customerBatch.push(customer);
      generatedCustomers.push(customer);
    }
    await db.insert(customers).values(customerBatch);

    // 4. Generate Orders
    const orderCount = faker.number.int({ min: 50, max: 150 });
    const orderBatch = [];
    for (let i = 0; i < orderCount; i++) {
      const customer = faker.helpers.arrayElement(generatedCustomers);
      const product = faker.helpers.arrayElement(generatedProducts);
      const qty = faker.number.int({ min: 1, max: 3 });
      const amount = (parseFloat(product.price) * qty).toFixed(2);
      
      orderBatch.push({
        id: faker.string.uuid(),
        userId,
        customerId: customer.id,
        amount,
        items: [{ productId: product.id, name: product.name, quantity: qty, price: product.price }],
        status: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'pending']),
        orderedAt: faker.date.recent({ days: 90 }),
        isMockData: true,
      });
    }
    if (orderBatch.length) await db.insert(orders).values(orderBatch);

    // 5. Campaign Generation Removed
    // Users want the experience of a fresh account (just imported customers/orders)
    // without pre-existing campaigns so they can create their first segment and campaign themselves.

    return NextResponse.json({ ok: true, message: 'Mock data generated successfully' });
  } catch (error) {
    console.error('Mock data generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate mock data', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
