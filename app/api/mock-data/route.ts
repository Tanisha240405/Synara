import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, customers, orders, products, campaigns, campaignStats, segments, messages, events } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { fakerEN_IN as faker } from '@faker-js/faker';

const INDUSTRY_PRODUCTS = {
  'E-Commerce & Retail': [
    { name: 'Wireless Earbuds', category: 'Electronics', price: '2499' },
    { name: 'Cotton T-Shirt', category: 'Apparel', price: '799' },
    { name: 'Smart Watch', category: 'Electronics', price: '4999' },
    { name: 'Running Shoes', category: 'Footwear', price: '2999' },
    { name: 'Denim Jeans', category: 'Apparel', price: '1499' },
    { name: 'Bluetooth Speaker', category: 'Electronics', price: '3499' },
    { name: 'Yoga Mat', category: 'Fitness', price: '899' },
    { name: 'Coffee Maker', category: 'Home Goods', price: '5499' },
    { name: 'Backpack', category: 'Accessories', price: '1299' },
    { name: 'Desk Lamp', category: 'Home Goods', price: '999' },
  ],
  'Travel & Hospitality': [
    { name: 'Goa Weekend Package', category: 'Package', price: '15000' },
    { name: 'Flight: DEL to BOM', category: 'Flight', price: '5500' },
    { name: 'Luxury Resort Stay', category: 'Hotel', price: '12000' },
    { name: 'Flight: BLR to DEL', category: 'Flight', price: '6500' },
    { name: 'Manali Trekking Package', category: 'Package', price: '8000' },
    { name: 'Boutique Hotel Stay', category: 'Hotel', price: '4500' },
    { name: 'Kerala Houseboat', category: 'Package', price: '18000' },
    { name: 'Flight: CCU to MAA', category: 'Flight', price: '4800' },
  ],
  'FinTech & Banking': [
    { name: 'Premium Savings Account', category: 'Account', price: '0' },
    { name: 'Platinum Credit Card', category: 'Credit Card', price: '1500' },
    { name: 'Personal Loan', category: 'Loan', price: '100000' },
    { name: 'Mutual Fund SIP', category: 'Investment', price: '5000' },
    { name: 'Travel Forex Card', category: 'Card', price: '200' },
    { name: 'Home Loan', category: 'Loan', price: '5000000' },
    { name: 'Fixed Deposit', category: 'Investment', price: '100000' },
  ],
  'Healthcare & Wellness': [
    { name: 'Full Body Checkup', category: 'Lab Test', price: '2999' },
    { name: 'General Consultation', category: 'Consultation', price: '500' },
    { name: 'Diet Plan Membership', category: 'Membership', price: '1499' },
    { name: 'Dental Cleaning', category: 'Service', price: '999' },
    { name: 'Annual Wellness Plan', category: 'Membership', price: '4999' },
    { name: 'Physiotherapy Session', category: 'Service', price: '800' },
    { name: 'Vitamin B12 Test', category: 'Lab Test', price: '400' },
  ],
  'FMCG & Grocery': [
    { name: 'Organic Green Tea', category: 'Beverages', price: '250' },
    { name: 'Whole Wheat Bread', category: 'Bakery', price: '50' },
    { name: 'Almond Milk 1L', category: 'Dairy', price: '300' },
    { name: 'Mixed Nuts 500g', category: 'Snacks', price: '650' },
    { name: 'Laundry Detergent 2kg', category: 'Household', price: '450' },
    { name: 'Olive Oil 1L', category: 'Pantry', price: '850' },
    { name: 'Fresh Apples 1kg', category: 'Produce', price: '200' },
    { name: 'Oats 1kg', category: 'Pantry', price: '180' },
    { name: 'Dishwash Gel', category: 'Household', price: '150' },
    { name: 'Dark Chocolate', category: 'Snacks', price: '120' },
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

    // 0. Clear existing mock data to prevent bloated mismatched values
    await db.execute(sql`DELETE FROM events`);
    await db.execute(sql`DELETE FROM messages`);
    await db.execute(sql`DELETE FROM campaign_stats`);
    await db.execute(sql`DELETE FROM campaigns WHERE is_mock_data = true`);
    await db.execute(sql`DELETE FROM orders WHERE is_mock_data = true`);
    await db.execute(sql`DELETE FROM customers WHERE is_mock_data = true`);

    // 1. Fetch or Generate Products
    const productSeeds = INDUSTRY_PRODUCTS[industrySegment as keyof typeof INDUSTRY_PRODUCTS];
    let generatedProducts = await db.select().from(products).where(eq(products.isMockData, true));
    
    if (generatedProducts.length === 0) {
      for (const p of productSeeds) {
        const [{ insertedId }] = await db.insert(products).values({
          id: faker.string.uuid(),
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
        customerId: customer.id,
        amount,
        items: [{ productId: product.id, name: product.name, quantity: qty, price: product.price }],
        status: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'pending']),
        orderedAt: faker.date.recent({ days: 90 }),
        isMockData: true,
      });
    }
    if (orderBatch.length) await db.insert(orders).values(orderBatch);

    // 5. Generate Campaigns and Messages
    const campaignNames = ['Diwali Mega Sale', 'Summer Collection', 'Reactivation Q3', 'VIP Exclusive Preview'];
    const campaignBatch = [];
    
    for (let i = 0; i < 4; i++) {
      const isSent = faker.datatype.boolean();
      const status = isSent ? 'completed' : 'draft';
      const cName = campaignNames[i];
      const targetCount = faker.number.int({ min: 50, max: customerCount });
      
      const campaign = {
        id: faker.string.uuid(),
        name: cName,
        channel: faker.helpers.arrayElement(['whatsapp', 'email', 'sms']),
        messageTemplate: `Hi {first_name}, check out our new ${cName}! Use code ${faker.string.alphanumeric(6).toUpperCase()} for 20% off.`,
        status,
        totalRecipients: targetCount,
        isMockData: true,
        sentAt: isSent ? faker.date.recent({ days: 14 }) : null,
        createdAt: faker.date.recent({ days: 30 }),
      };
      
      const [{ insertedId }] = await db.insert(campaigns).values(campaign).returning({ insertedId: campaigns.id });
      
      if (isSent) {
        // Generate messages for this campaign
        const messageBatch: any[] = [];
        const eventBatch: any[] = [];
        const targetedCustomers = faker.helpers.arrayElements(generatedCustomers, targetCount);
        
        let delivered = 0, opened = 0, clicked = 0, converted = 0, failed = 0;
        
        for (const customer of targetedCustomers) {
          const msgStatus = faker.helpers.weightedArrayElement([
            { weight: 60, value: 'delivered' },
            { weight: 20, value: 'opened' },
            { weight: 10, value: 'clicked' },
            { weight: 5, value: 'converted' },
            { weight: 5, value: 'failed' }
          ]);
          
          const sentAt = faker.date.between({ from: campaign.sentAt!, to: new Date() });
          const msgId = faker.string.uuid();

          if (msgStatus === 'delivered') delivered++;
          else if (msgStatus === 'opened') { delivered++; opened++; }
          else if (msgStatus === 'clicked') { delivered++; opened++; clicked++; }
          else if (msgStatus === 'converted') { delivered++; opened++; clicked++; converted++; }
          else failed++;
          
          messageBatch.push({
            id: msgId,
            campaignId: insertedId,
            customerId: customer.id,
            channel: campaign.channel,
            content: `Hi ${customer.name.split(' ')[0]}, check out our new ${cName}! Use code ${faker.string.alphanumeric(6).toUpperCase()} for 20% off.`,
            status: msgStatus,
            sentAt,
            createdAt: campaign.createdAt,
          });

          // Seed events for the live feed
          // Only add events for the last few days to keep it "recent"
          if (new Date().getTime() - sentAt.getTime() < 3 * 24 * 60 * 60 * 1000) {
            const baseEvent = { messageId: msgId, campaignId: insertedId, customerId: customer.id, channel: campaign.channel };
            if (msgStatus === 'failed') eventBatch.push({ ...baseEvent, eventType: 'failed', receivedAt: sentAt });
            else {
              eventBatch.push({ ...baseEvent, eventType: 'delivered', receivedAt: sentAt });
              if (msgStatus === 'opened' || msgStatus === 'clicked' || msgStatus === 'converted') {
                eventBatch.push({ ...baseEvent, eventType: 'opened', receivedAt: new Date(sentAt.getTime() + 1000 * 60 * 5) });
              }
              if (msgStatus === 'clicked' || msgStatus === 'converted') {
                eventBatch.push({ ...baseEvent, eventType: 'clicked', receivedAt: new Date(sentAt.getTime() + 1000 * 60 * 15) });
              }
              if (msgStatus === 'converted') {
                eventBatch.push({ ...baseEvent, eventType: 'converted', receivedAt: new Date(sentAt.getTime() + 1000 * 60 * 60) });
              }
            }
          }
        }
        
        // Batch insert messages
        for (let j = 0; j < messageBatch.length; j += 100) {
          await db.insert(messages).values(messageBatch.slice(j, j + 100));
        }

        // Batch insert events
        for (let j = 0; j < eventBatch.length; j += 100) {
          await db.insert(events).values(eventBatch.slice(j, j + 100));
        }
        
        // Insert stats
        await db.insert(campaignStats).values({
          campaignId: insertedId,
          totalSent: targetCount,
          totalDelivered: delivered,
          totalOpened: opened,
          totalClicked: clicked,
          totalFailed: failed,
          totalOrderPlaced: converted,
          revenueAttributed: (converted * faker.number.int({ min: 500, max: 5000 })).toString(),
        });
      }
    }

    return NextResponse.json({ ok: true, message: 'Mock data generated successfully' });
  } catch (error) {
    console.error('Mock data generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate mock data', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
