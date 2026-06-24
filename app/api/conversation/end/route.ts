import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { endConversation } from '@/lib/tavus';

// Ends a Tavus conversation server-side. The client calls this when a session
// ends so the replica actually disconnects and stops billing, instead of
// lingering "active" until Tavus' participant_left_timeout fires.
export async function POST(req: NextRequest) {
  try {
    const { conversationId } = await req.json();
    if (conversationId) {
      await endConversation(conversationId, env.tavus.apiKey);
    }
  } catch (err) {
    // Best-effort: never block the client teardown on this.
    console.error('Failed to end conversation:', err);
  }
  return NextResponse.json({ ok: true });
}
