import { db } from './db';
import { campaigns, campaignStats, messages, events } from './schema';
import { eq, inArray } from 'drizzle-orm';
import { fakerEN_IN as faker } from '@faker-js/faker';

const SIMULATION_SPEED_MULTIPLIER = parseInt(process.env.SIMULATION_SPEED_MULTIPLIER || '1', 10);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms / SIMULATION_SPEED_MULTIPLIER));

export async function simulateCampaignDelivery(campaignId: string) {
  (async () => {
    try {
      console.log(`[sim] Starting campaign: ${campaignId}`);

      await db.update(campaigns)
        .set({ status: 'sending', sentAt: new Date() })
        .where(eq(campaigns.id, campaignId));

      // Fetch all pending messages using drizzle (avoids raw sql column issues)
      const pendingMessages = await db.select()
        .from(messages)
        .where(eq(messages.campaignId, campaignId));

      const pending = pendingMessages.filter(m => m.status === 'pending' || m.status === 'queued');

      if (pending.length === 0) {
        console.log(`[sim] No pending messages for ${campaignId}, marking completed`);
        await db.update(campaigns).set({ status: 'completed', completedAt: new Date() }).where(eq(campaigns.id, campaignId));
        return;
      }

      console.log(`[sim] Found ${pending.length} pending messages. Simulating...`);

      // ── Phase 1: pending → delivered / failed ────────────────────────────
      let remaining = [...pending];
      let totalDelivered = 0, totalFailed = 0;

      while (remaining.length > 0) {
        const batchSize = Math.max(1, Math.floor(pending.length * (Math.random() * 0.1 + 0.05)));
        const batch = remaining.splice(0, batchSize);
        await delay(faker.number.int({ min: 800, max: 2500 }));

        const deliveredIds: string[] = [];
        const failedIds: string[] = [];
        const eventInserts: any[] = [];

        for (const msg of batch) {
          if (Math.random() < 0.05) {
            failedIds.push(msg.id);
            eventInserts.push({ messageId: msg.id, campaignId, customerId: msg.customerId, eventType: 'failed', channel: msg.channel });
          } else {
            deliveredIds.push(msg.id);
            eventInserts.push({ messageId: msg.id, campaignId, customerId: msg.customerId, eventType: 'delivered', channel: msg.channel });
          }
        }

        if (deliveredIds.length > 0) {
          await db.update(messages).set({ status: 'delivered', sentAt: new Date() }).where(inArray(messages.id, deliveredIds));
          totalDelivered += deliveredIds.length;
        }
        if (failedIds.length > 0) {
          await db.update(messages).set({ status: 'failed', sentAt: new Date() }).where(inArray(messages.id, failedIds));
          totalFailed += failedIds.length;
        }
        if (eventInserts.length > 0) {
          await db.insert(events).values(eventInserts);
        }

        // Real-time stat update for Phase 1
        await db.update(campaignStats)
          .set({ totalDelivered, totalFailed })
          .where(eq(campaignStats.campaignId, campaignId));
      }

      // ── Phase 2: delivered → opened ──────────────────────────────────────
      const deliveredMsgs = await db.select().from(messages)
        .where(eq(messages.campaignId, campaignId));
      const toOpen = deliveredMsgs
        .filter(m => m.status === 'delivered')
        .slice(0, Math.floor(deliveredMsgs.filter(m => m.status === 'delivered').length * faker.number.float({ min: 0.3, max: 0.55 })));

      let openedCount = 0;
      let openRemaining = faker.helpers.shuffle(toOpen);
      while (openRemaining.length > 0) {
        const batchSize = Math.max(1, Math.floor(toOpen.length * (Math.random() * 0.12 + 0.08)));
        const batch = openRemaining.splice(0, batchSize);
        await delay(faker.number.int({ min: 1500, max: 4000 }));
        const ids = batch.map(b => b.id);
        await db.update(messages).set({ status: 'opened' }).where(inArray(messages.id, ids));
        await db.insert(events).values(batch.map(msg => ({ messageId: msg.id, campaignId, customerId: msg.customerId, eventType: 'opened', channel: msg.channel })));
        openedCount += ids.length;
        
        // Real-time stat update for Phase 2
        await db.update(campaignStats).set({ totalOpened: openedCount }).where(eq(campaignStats.campaignId, campaignId));
      }

      // ── Phase 3: opened → clicked ─────────────────────────────────────────
      const openedMsgs = (await db.select().from(messages).where(eq(messages.campaignId, campaignId)))
        .filter(m => m.status === 'opened');
      const toClick = faker.helpers.shuffle(openedMsgs)
        .slice(0, Math.floor(openedMsgs.length * faker.number.float({ min: 0.1, max: 0.28 })));

      let clickedCount = 0;
      let clickRemaining = [...toClick];
      while (clickRemaining.length > 0) {
        const batchSize = Math.max(1, Math.floor(toClick.length * (Math.random() * 0.15 + 0.1)));
        const batch = clickRemaining.splice(0, batchSize);
        await delay(faker.number.int({ min: 2000, max: 5500 }));
        const ids = batch.map(b => b.id);
        await db.update(messages).set({ status: 'clicked' }).where(inArray(messages.id, ids));
        await db.insert(events).values(batch.map(msg => ({ messageId: msg.id, campaignId, customerId: msg.customerId, eventType: 'clicked', channel: msg.channel })));
        clickedCount += ids.length;
        
        // Real-time stat update for Phase 3
        await db.update(campaignStats).set({ totalClicked: clickedCount }).where(eq(campaignStats.campaignId, campaignId));
      }

      // ── Phase 4: clicked → order_placed ─────────────────────────────────────
      const clickedMsgs = (await db.select().from(messages).where(eq(messages.campaignId, campaignId)))
        .filter(m => m.status === 'clicked');
      const toConvert = faker.helpers.shuffle(clickedMsgs)
        .slice(0, Math.floor(clickedMsgs.length * faker.number.float({ min: 0.05, max: 0.15 })));

      let convertedCount = 0;
      let revenue = 0;
      let convertRemaining = [...toConvert];
      while (convertRemaining.length > 0) {
        const batchSize = Math.max(1, Math.floor(toConvert.length * (Math.random() * 0.2 + 0.1)));
        const batch = convertRemaining.splice(0, batchSize);
        await delay(faker.number.int({ min: 3000, max: 7000 }));
        const ids = batch.map(b => b.id);
        const batchRevenue = ids.length * faker.number.int({ min: 500, max: 8000 });
        await db.update(messages).set({ status: 'order_placed' }).where(inArray(messages.id, ids));
        await db.insert(events).values(batch.map(msg => ({ messageId: msg.id, campaignId, customerId: msg.customerId, eventType: 'order_placed', channel: msg.channel, metadata: { order_amount: batchRevenue / ids.length } })));
        convertedCount += ids.length;
        revenue += batchRevenue;
        
        // Real-time stat update for Phase 4
        await db.update(campaignStats)
          .set({ totalOrderPlaced: convertedCount, revenueAttributed: String(revenue) })
          .where(eq(campaignStats.campaignId, campaignId));
      }

      console.log(`[sim] Complete for ${campaignId}. Delivered=${totalDelivered} Opened=${openedCount} Clicked=${clickedCount} Converted=${convertedCount}`);
      await db.update(campaigns).set({ status: 'completed', completedAt: new Date() }).where(eq(campaigns.id, campaignId));

    } catch (error) {
      console.error(`[sim] Error for campaign ${campaignId}:`, error);
    }
  })();
}
