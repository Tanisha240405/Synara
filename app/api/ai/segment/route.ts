import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/client';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const prompt = `You are a PostgreSQL expert for an Indian consumer brand CRM.
Convert this audience description to a SQL WHERE clause for the customers table.
Available columns:
- name (text), email (text), phone (text)
- channel_preference (text: 'whatsapp'|'sms'|'email'|'rcs')
- tier (text: 'regular'|'gold'|'platinum'|'diamond')
- total_orders (integer), total_spend (decimal, in INR), ltv (decimal, in INR)
- last_purchase_at (timestamp), last_engaged_at (timestamp), churn_risk (decimal 0-100), city (text), created_at (timestamp)

CRITICAL RULES:
1. ALWAYS use ILIKE instead of = for text columns (e.g. city ILIKE 'mumbai', tier ILIKE 'gold', channel_preference ILIKE 'sms') to ensure case-insensitivity.
2. For filterJson, use "operator": "ILIKE" for text fields.

Query: "${query}"

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "segmentName": "Short 3-5 word name",
  "sqlWhere": "tier = 'gold' AND total_orders >= 2",
  "filterJson": {
    "operator": "AND",
    "conditions": [
      { "field": "tier", "operator": "=", "value": "gold" },
      { "field": "total_orders", "operator": ">=", "value": 2 }
    ]
  },
  "confidence": 94.5,
  "reasoning": "One sentence explanation"
}`;

  try {
    const data = await aiChat({
      messages: [{ role: 'user', content: prompt }]
    });
    
    const content = data.choices[0].message.content || '{}';
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate segment' }, { status: 500 });
  }
}