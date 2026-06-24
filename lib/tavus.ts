import { DailyTransitResponse } from '@/types/astrology';

interface ConversationalContextArgs {
  userName: string;
  detectedMood: string;
  astroInsight: DailyTransitResponse;
  scriptureContext: { passage: string; source: string; reflection: string };
  affirmations: string[];
}

export function buildConversationalContext({
  userName,
  detectedMood,
  astroInsight,
  scriptureContext,
  affirmations,
}: ConversationalContextArgs): string {
  const topAffirmation =
    affirmations.length > 0
      ? affirmations[Math.floor(Math.random() * affirmations.length)]
      : null;

  return `
=== SESSION CONTEXT FOR ${userName.toUpperCase()} ===

DETECTED EMOTIONAL STATE
The user's facial and vocal cues suggest they are feeling: ${detectedMood}.
Approach this with compassion. Do not state this as a fact; instead, gently reflect it back.

TODAY'S ASTROLOGICAL THEME
${astroInsight.overall_theme}

Key transits affecting ${userName} today:
${astroInsight.transits
  .slice(0, 3)
  .map(
    (t) =>
      `- ${t.planet} in ${t.sign}${
        t.aspect ? ` ${t.aspect} natal ${t.natal_planet}` : ''
      }: ${t.interpretation}`
  )
  .join('\n')}

SPIRITUAL / RELIGIOUS CONTEXT
Passage: "${scriptureContext.passage}"
Source: ${scriptureContext.source}
Reflection: ${scriptureContext.reflection}

${topAffirmation ? `PERSONAL AFFIRMATION (pre-programmed by user):\n"${topAffirmation}"` : ''}

INSTRUCTIONS
Weave this context naturally into the conversation. Start by noticing how ${userName} seems to be doing.
Reference astrology gently as a lens, not a determinism. Use the scripture or spiritual wisdom only if it
feels truly relevant. End with at least one concrete, actionable suggestion.
`.trim();
}

export async function endConversation(conversationId: string, apiKey: string): Promise<void> {
  await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
  });
}
