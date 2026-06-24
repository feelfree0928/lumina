import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';
import type { SessionAnalysis, TranscriptLine } from '@/types/analysis';

// Shared Anthropic client reused by scripture retrieval, the /api/claude route,
// and post-session insight generation.
export const claude = new Anthropic({ apiKey: env.anthropic.apiKey });

export const CLAUDE_MODEL = 'claude-sonnet-4-6';

/**
 * Generate a short, written reflection summarising a session — used for an
 * optional after-session insight card. Non-streaming.
 */
export async function generateInsightSummary(args: {
  userName: string;
  mood: string;
  theme: string;
  scripturePassage: string;
}): Promise<string> {
  const { userName, mood, theme, scripturePassage } = args;

  const prompt = `Write a brief, warm, second-person reflection (under 80 words) for ${userName},
who appeared to be feeling ${mood} today. Today's astrological theme: "${theme}".
A passage that may resonate: "${scripturePassage}".
End with one small, concrete next step. No preamble — just the reflection.`;

  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content[0];
    return block && block.type === 'text' ? block.text.trim() : '';
  } catch (err) {
    console.error('Insight summary error:', err);
    return '';
  }
}

const ANALYSIS_FALLBACK: SessionAnalysis = {
  summary: 'You took time today to check in with yourself. That matters.',
  themes: [],
  advice: ['Be gentle with yourself for the rest of the day.'],
  affirmation: 'You showed up for yourself today — that counts.',
  tieIn: '',
};

/**
 * Produce a structured, compassionate post-session analysis from the full
 * conversation transcript. Non-streaming; returns parsed JSON with a graceful
 * fallback (mirrors the JSON-from-Claude pattern in lib/scripture.ts).
 */
export async function generateSessionAnalysis(args: {
  userName: string;
  religion?: string;
  theme?: string;
  scripturePassage?: string;
  transcript: TranscriptLine[];
}): Promise<SessionAnalysis> {
  const { userName, religion, theme, scripturePassage, transcript } = args;

  // Keep only meaningful lines and bound the size (most recent ~60 turns).
  const lines = transcript
    .filter((l) => l.text && l.text.trim())
    .slice(-60)
    .map((l) => `${l.role === 'user' ? userName : 'Lumina'}: ${l.text.trim()}`)
    .join('\n');

  if (!lines) {
    return ANALYSIS_FALLBACK;
  }

  const prompt = `You are Lumina, a warm, emotionally-attuned self-development companion. The conversation below just ended. Reflect on it for ${userName} and write a brief, caring post-session analysis.

${theme ? `Today's astrological theme for ${userName}: "${theme}".` : ''}
${scripturePassage ? `A passage that was shared today: "${scripturePassage}".` : ''}
${religion ? `${userName}'s spiritual tradition: ${religion}.` : ''}

TRANSCRIPT:
${lines}

Write the reflection in second person ("you"), in the SAME language the conversation was held in. Be specific to what was actually said — do not invent details. Respond ONLY with a JSON object in exactly this format (no markdown, no preamble):
{
  "summary": "2-4 sentences recapping what this conversation was really about and how ${userName} seemed.",
  "themes": ["3-5 short phrases naming the emotional or topical threads that surfaced"],
  "advice": ["3-5 concrete, gentle, actionable next steps tailored to what was discussed"],
  "affirmation": "One short, warm affirmation for ${userName} to carry forward.",
  "tieIn": "One sentence gently connecting the reflection to today's theme or passage (empty string if none fits)."
}`;

  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    const raw = block && block.type === 'text' ? block.text : '';
    // Strip any accidental code fences, then isolate the JSON object.
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const json = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned;
    const parsed = JSON.parse(json);

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : ANALYSIS_FALLBACK.summary,
      themes: Array.isArray(parsed.themes) ? parsed.themes.filter((t: unknown) => typeof t === 'string') : [],
      advice: Array.isArray(parsed.advice)
        ? parsed.advice.filter((t: unknown) => typeof t === 'string')
        : ANALYSIS_FALLBACK.advice,
      affirmation:
        typeof parsed.affirmation === 'string' ? parsed.affirmation : ANALYSIS_FALLBACK.affirmation,
      tieIn: typeof parsed.tieIn === 'string' ? parsed.tieIn : '',
    };
  } catch (err) {
    console.error('Session analysis error:', err);
    return ANALYSIS_FALLBACK;
  }
}
