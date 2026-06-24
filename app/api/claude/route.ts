import { NextRequest } from 'next/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude';

export async function POST(req: NextRequest) {
  const { systemPrompt, userMessage, history } = await req.json();

  const stream = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    stream: true,
    messages: [...(history || []), { role: 'user', content: userMessage }],
  });

  // Stream the response back to the client
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
