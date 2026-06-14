import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { segmentName, healthScore, status, population } = await req.json();

    const prompt = `
      You are an expert CRM AI. 
      Analyze the customer segment "${segmentName}" with population ${population}.
      Its health score is ${healthScore}/100, status: ${status}.
      
      Respond ONLY with a JSON object in this exact format:
      {
        "bullets": ["Point 1 explaining the health score", "Point 2 about engagement", "Point 3 about opportunity"],
        "recommendation": "One clear sentence recommending the next best action.",
        "draftMessage": "A short, engaging SMS/WhatsApp draft message to re-engage this segment."
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error('Groq Segment Insight Error:', error);
    return NextResponse.json({
      bullets: ["Engagement metrics are shifting.", "Recent data indicates lower frequency.", "Opportunity to re-engage via targeted offers."],
      recommendation: "Deploy an immediate win-back campaign with a 15% discount.",
      draftMessage: "Hey! We haven't seen you in a while. Come back and enjoy 15% off your next purchase with code WINBACK15."
    });
  }
}
