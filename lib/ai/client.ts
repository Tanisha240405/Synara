import { db } from '@/lib/db';
import { aiCallLogs } from '@/lib/schema';

export interface AIChatOptions {
  messages: any[];
  tools?: any[];
  model?: string;
  speed?: 'fast' | 'versatile';
}

export async function aiChat({ messages, tools, model, speed }: AIChatOptions) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  const selectedModel = model || (speed === 'fast' ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile');

  const payload: any = {
    model: selectedModel,
    messages,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const startTime = Date.now();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  const durationMs = Date.now() - startTime;

  if (!response.ok) {
    console.error('Groq API Error:', data);
    throw new Error(`Groq API Error: ${data.error?.message || response.statusText}`);
  }

  // Log to database asynchronously so we don't block the return
  db.insert(aiCallLogs).values({
    modelUsed: selectedModel,
    promptTokens: data.usage?.prompt_tokens || 0,
    completionTokens: data.usage?.completion_tokens || 0,
    durationMs,
  }).catch(err => {
    console.error('Failed to log AI call:', err);
  });

  return data;
}
