import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/client';

export async function POST(req: NextRequest) {
  const { segmentName, channel, productName, productPrice, extraContext } = await req.json();

  const prompt = `You are a creative marketing copywriter for Indian consumer brands.

Write exactly 3 distinct, engaging promotional message options for a ${channel.toUpperCase()} campaign targeting the "${segmentName}" audience segment.
${productName ? `\nPRODUCT TO PROMOTE: ${productName} — Price: ₹${productPrice}\nAll 3 messages MUST clearly mention this product and its price.` : ''}
${extraContext ? `\nUSER INSTRUCTIONS (follow strictly): ${extraContext}` : ''}

Rules:
- Keep SMS messages under 160 characters
- WhatsApp messages can use *bold* and emojis
- Each option must sound different in tone (e.g., urgency, friendly, premium)
- Use natural Indian English
- Do NOT add any explanation, preamble, or extra text

Respond ONLY with a raw JSON array of exactly 3 strings:
["message 1 text here", "message 2 text here", "message 3 text here"]`;

  try {
    const data = await aiChat({
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = (data.choices[0].message.content || '[]')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let drafts: string[];
    try {
      const parsed = JSON.parse(raw);
      drafts = Array.isArray(parsed) ? parsed : [raw];
    } catch {
      // If still can't parse, split by numbered lines as fallback
      const lines = raw.split(/\n\d+\.\s+/).filter(Boolean);
      drafts = lines.length >= 2 ? lines : [raw];
    }

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Draft generation error:', error);
    return NextResponse.json({ error: 'Failed to generate drafts' }, { status: 500 });
  }
}
