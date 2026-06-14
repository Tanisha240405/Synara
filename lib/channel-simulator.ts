export async function simulateDelivery(messageId: string, campaignId: string, customerId: string, channel: string, appUrl: string) {
  const failureRate = parseFloat(process.env.CHANNEL_FAILURE_RATE || '0.08');
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  await callReceipt('sent', messageId, campaignId, customerId, channel, appUrl);

  await sleep(rand(500, 3000));
  if (Math.random() < failureRate) {
    await callReceipt('failed', messageId, campaignId, customerId, channel, appUrl);
    return;
  }
  await callReceipt('delivered', messageId, campaignId, customerId, channel, appUrl);

  if (Math.random() < 0.45) {
    await sleep(rand(1000, 8000));
    await callReceipt('opened', messageId, campaignId, customerId, channel, appUrl);

    if (Math.random() < 0.20) {
      await sleep(rand(500, 3000));
      await callReceipt('clicked', messageId, campaignId, customerId, channel, appUrl);

      if (Math.random() < 0.05) {
        await sleep(rand(500, 2000));
        await callReceipt('order_placed', messageId, campaignId, customerId, channel, appUrl);
      }
    }
  }
}

async function callReceipt(eventType: string, messageId: string, campaignId: string, customerId: string, channel: string, appUrl: string) {
  await fetch(`${appUrl}/api/crm/receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.NEXTAUTH_SECRET!
    },
    body: JSON.stringify({ eventType, messageId, campaignId, customerId, channel })
  }).catch(e => console.error("Receipt error:", e));
}
