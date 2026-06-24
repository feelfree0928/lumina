import { NextRequest, NextResponse } from 'next/server';
import { TavusPerceptionEvent } from '@/types/tavus';
import { perceptionStore } from '@/lib/perception-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate it's a perception event
    if (body.event_type === 'application.perception_analysis') {
      const event = body as TavusPerceptionEvent;
      perceptionStore.set(event.conversation_id, event.properties);
      console.log(
        `[Perception] ${event.conversation_id}:`,
        event.properties.perception_result?.emotions
      );
    }

    // Acknowledge the webhook
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
