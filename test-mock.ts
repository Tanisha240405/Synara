import { db } from './lib/db';
import { users, customers, orders, products, campaigns, campaignStats, segments, messages } from './lib/schema';
import { eq } from 'drizzle-orm';
import { faker } from '@faker-js/faker';

const INDUSTRY_PRODUCTS = {
  'E-Commerce & Retail': [
    { name: 'Wireless Earbuds', category: 'Electronics', price: '2499' },
  ]
};

async function run() {
  const industrySegment = 'E-Commerce & Retail';
  try {
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

    const customerCount = 10;
    const generatedCustomers = [];
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

    const orderCount = 5;
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

    const campaignCount = 2;
    for (let i = 0; i < campaignCount; i++) {
      const channel = faker.helpers.arrayElement(['whatsapp', 'sms', 'email']);
      const totalSent = faker.number.int({ min: 100, max: 5000 });
      const totalDelivered = Math.floor(totalSent * faker.number.float({ min: 0.85, max: 0.99 }));
      const totalOpened = Math.floor(totalDelivered * faker.number.float({ min: 0.4, max: 0.8 }));
      const totalClicked = Math.floor(totalOpened * faker.number.float({ min: 0.1, max: 0.3 }));
      const totalOrderPlaced = Math.floor(totalClicked * faker.number.float({ min: 0.05, max: 0.15 }));
      const revenueAttributed = (totalOrderPlaced * faker.number.int({ min: 500, max: 5000 })).toFixed(2);

      const product = faker.helpers.arrayElement(generatedProducts);

      const [{ campaignId }] = await db.insert(campaigns).values({
        id: faker.string.uuid(),
        name: `${faker.commerce.department()} Promo`,
        channel,
        productId: Math.random() > 0.3 ? product.id : null,
        messageTemplate: `Hello {first_name}, check out our latest offer...`,
        status: faker.helpers.arrayElement(['completed', 'completed', 'sending', 'draft']),
        sentAt: faker.date.recent({ days: 30 }),
        totalRecipients: totalSent,
        isMockData: true,
      }).returning({ campaignId: campaigns.id });

      await db.insert(campaignStats).values({
        id: faker.string.uuid(),
        campaignId,
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalOrderPlaced,
        revenueAttributed,
      });

      const recipientCount = 5;
      const messageBatch = [];
      for (let j = 0; j < recipientCount; j++) {
        const customer = faker.helpers.arrayElement(generatedCustomers);
        messageBatch.push({
          id: faker.string.uuid(),
          campaignId,
          customerId: customer.id,
          channel,
          content: `Mock message to ${customer.name}`,
          status: faker.helpers.arrayElement(['delivered', 'opened', 'clicked', 'converted', 'failed']),
          sentAt: faker.date.recent({ days: 30 }),
        });
      }
      if (messageBatch.length > 0) {
        await db.insert(messages).values(messageBatch);
      }
    }
    console.log("SUCCESS");
  } catch(e) {
    console.error("FAILED", e);
  }
}

run();
