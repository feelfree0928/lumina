import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { buildConversationalContext } from '@/lib/tavus';
import { getDailyInsight } from '@/lib/astrology';
import { getScriptureContext } from '@/lib/scripture';
import { UserProfile } from '@/types/profile';

// Ends active conversations bound to the given replica so a fresh session can
// acquire it. Best-effort — never throws into the request path.
async function endStaleConversations(replicaId: string): Promise<void> {
  try {
    const res = await fetch('https://tavusapi.com/v2/conversations?status=active', {
      headers: { 'x-api-key': env.tavus.apiKey },
    });
    if (!res.ok) return;
    const json = await res.json();
    const active: Array<{ conversation_id: string; replica_id?: string }> = json?.data || [];
    await Promise.all(
      active
        .filter((c) => !c.replica_id || c.replica_id === replicaId)
        .map((c) =>
          fetch(`https://tavusapi.com/v2/conversations/${c.conversation_id}/end`, {
            method: 'POST',
            headers: { 'x-api-key': env.tavus.apiKey },
          }).catch(() => undefined)
        )
    );
  } catch (err) {
    console.error('Failed to end stale conversations:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;
    const detectedMood: string = body.mood || 'unknown';

    if (!profile?.birthDetails) {
      return NextResponse.json({ error: 'Missing profile' }, { status: 400 });
    }

    // 1. Fetch today's astrological insight for this user
    const astroInsight = await getDailyInsight(profile.birthDetails);

    // 2. Get relevant scripture based on mood + religion
    const scriptureContext = await getScriptureContext({
      religion: profile.religion,
      mood: detectedMood,
      affirmations: profile.customAffirmations,
    });

    // 3. Build the conversational context string passed to Tavus
    const conversationalContext = buildConversationalContext({
      userName: profile.name,
      detectedMood,
      astroInsight,
      scriptureContext,
      affirmations: profile.customAffirmations,
    });

    // 3b. End any stale active conversations on this replica. A replica can only
    // be in one conversation at a time; abandoned/refreshed sessions otherwise
    // pile up as "active" and starve new ones (replica never joins → "Connecting").
    await endStaleConversations(env.tavus.replicaId);

    // 4. Create Tavus conversation session
    const tavusResponse = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.tavus.apiKey,
      },
      body: JSON.stringify({
        replica_id: env.tavus.replicaId,
        persona_id: env.tavus.personaId,
        conversation_name: `Lumina Session — ${profile.name} — ${new Date().toISOString()}`,
        conversational_context: conversationalContext,
        custom_greeting: `Hello ${profile.name}. I'm glad you're here. Take a breath with me — let's see how you're really doing today.`,
        callback_url: `${env.app.url}/api/webhook/tavus`,
        properties: {
          enable_recording: false,
          max_call_duration: 1800, // 30 minutes max
          participant_left_timeout: 60, // end 60s after the user leaves
          participant_absent_timeout: 120, // end if nobody ever joins (avoids burning credits on stuck sessions)
        },
      }),
    });

    if (!tavusResponse.ok) {
      const error = await tavusResponse.json().catch(() => ({}));
      console.error('Tavus API error:', error);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 502 });
    }

    const conversation = await tavusResponse.json();

    return NextResponse.json({
      conversationId: conversation.conversation_id,
      conversationUrl: conversation.conversation_url,
      astroInsight,
      scriptureContext,
    });
  } catch (err) {
    console.error('Conversation creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
