import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Thin wrapper to create/update a Tavus persona at runtime if needed.
// The primary path is scripts/create-tavus-persona.ts (run once); this route
// exists so the persona can also be (re)created from the app.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const response = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.tavus.apiKey,
      },
      body: JSON.stringify({
        persona_name: body.persona_name || 'Lumina',
        system_prompt: body.system_prompt,
        default_replica_id: env.tavus.replicaId,
        ...(body.layers ? { layers: body.layers } : {}),
        ...(body.context ? { context: body.context } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Persona creation error:', error);
      return NextResponse.json({ error: 'Failed to create persona' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ personaId: data.persona_id });
  } catch (err) {
    console.error('Persona route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
