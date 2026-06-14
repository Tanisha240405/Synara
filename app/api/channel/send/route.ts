import { NextRequest, NextResponse } from 'next/server';
import { simulateDelivery } from '@/lib/channel-simulator';
import { waitUntil } from '@vercel/functions';

export async function POST(req: NextRequest) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get('host') ? `http://${req.headers.get('host')}` : 'http://localhost:3000');
    const { messageId, customerId, campaignId, channel } = await req.json();
    waitUntil(simulateDelivery(messageId, campaignId, customerId, channel, appUrl));
    return NextResponse.json({ dispatched: true }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}