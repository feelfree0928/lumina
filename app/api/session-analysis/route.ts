import { NextRequest, NextResponse } from 'next/server';
import { generateSessionAnalysis } from '@/lib/claude';
import type { TranscriptLine } from '@/types/analysis';

// Builds a structured post-session reflection from the conversation transcript.
// Server-side so the Anthropic key stays on the server.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transcript: TranscriptLine[] = Array.isArray(body.transcript) ? body.transcript : [];

    const analysis = await generateSessionAnalysis({
      userName: body.userName || 'friend',
      religion: body.religion,
      theme: body.theme,
      scripturePassage: body.scripturePassage,
      transcript,
    });

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('Session analysis route error:', err);
    return NextResponse.json({ error: 'Failed to analyze session' }, { status: 500 });
  }
}
