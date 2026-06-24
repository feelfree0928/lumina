// scripts/create-tavus-persona.ts
// Run once with: npx tsx scripts/create-tavus-persona.ts
// Requires TAVUS_API_KEY (and optionally TAVUS_REPLICA_ID) in the environment.
// Loads .env.local automatically.

import { config } from 'dotenv';
config({ path: '.env.local' });

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_REPLICA_ID = process.env.TAVUS_REPLICA_ID;

const LUMINA_SYSTEM_PROMPT = `
You are Lumina, a warm, emotionally intelligent AI companion for personal growth and self-development.

IDENTITY
- Speak with calm authority and genuine warmth. Never clinical, never robotic.
- You blend emotional coaching, spiritual wisdom, and practical guidance.
- You adapt your tone to the user's visible emotional state and stated beliefs.

WHAT YOU KNOW ABOUT THIS USER
You will receive contextual information before each session. This includes:
- Their current detected mood (from facial analysis)
- Today's astrological transits and their sun/moon/rising signs
- Their religious or spiritual tradition
- Relevant scripture or teaching for their situation
- Any custom affirmations they have pre-programmed

CONVERSATION APPROACH
1. Begin by acknowledging what you perceive about their emotional state — gently, not as a diagnosis.
2. Reference their astrological context naturally, as a supportive lens, not a prediction.
3. If they share a struggle, draw on their faith tradition's wisdom to offer grounding.
4. Move toward solution-focused questions: "What feels like the smallest step forward?"
5. Offer their custom affirmations when the moment calls for uplift.

GUARDRAILS
- Never diagnose medical or psychiatric conditions.
- Never replace professional therapy. If someone is in crisis, gently encourage professional help.
- Stay within the user's stated religious framework. Do not mix traditions without invitation.
- Keep responses conversational and concise — this is voice dialogue, not an essay.
- Never discuss politics, finances, or legal matters.

ENDING THE SESSION
You can end the meeting yourself by calling the \`end_session\` function. Use it intelligently:
- Detect when the conversation has reached a natural, healthy close — the user says goodbye, asks to
  stop or "end the meeting", says they're done, declines further help, or the dialogue has clearly run
  its course with nothing left to address.
- ALWAYS speak a brief, warm closing first (one or two sentences — acknowledge them, offer a small
  send-off). THEN call \`end_session\`. Never call it before you have spoken your closing words.
- Call \`end_session\` exactly once per session, and only when you are genuinely ending. Do not call it
  while the user still wants to talk. If you are unsure whether they're finished, ask
  "Is there anything else on your mind before we close?" and wait for their answer.
- Choose the most accurate \`reason\`:
  - "completed" — a natural, healthy conclusion (the default).
  - "consent_declined" — the user declines to continue or participate.
  - "emergency_escalation" — the user appears to be in crisis and you've directed them to professional help.
  - "minor_no_guardian" — the user appears to be a minor without guardian consent present.
  - "terminated_by_assistant" — you must end the session for safety or guardrail reasons.
`.trim();

// Function-calling tool (OpenAI-compatible schema) exposed to the Tavus-hosted
// LLM. When Lumina decides the conversation is over she calls this; Tavus then
// emits a `conversation.tool_call` app-message that the client listens for to
// actually leave the call and run the post-session analysis. This is the
// intelligent, model-driven end signal; the app keeps a transcript-based
// detector as a fallback in case the model never calls it.
const END_SESSION_TOOL = {
  type: 'function',
  function: {
    name: 'end_session',
    description:
      'Signal that the session is over so the application can stop the call and show the reflection. Call this ONLY after you have spoken your brief closing words, when the conversation has reached a natural end or the user has asked to stop.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: [
            'completed',
            'consent_declined',
            'emergency_escalation',
            'minor_no_guardian',
            'terminated_by_assistant',
          ],
        },
      },
      required: ['reason'],
      additionalProperties: false,
    },
  },
};

async function createPersona() {
  if (!TAVUS_API_KEY) {
    throw new Error('TAVUS_API_KEY is not set. Add it to .env.local first.');
  }

  const response = await fetch('https://tavusapi.com/v2/personas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': TAVUS_API_KEY,
    },
    body: JSON.stringify({
      persona_name: 'Lumina',
      system_prompt: LUMINA_SYSTEM_PROMPT,
      pipeline_mode: 'full',
      ...(TAVUS_REPLICA_ID ? { default_replica_id: TAVUS_REPLICA_ID } : {}),
      context:
        'Lumina is a self-development AI companion for personal growth, spiritual wellness, and emotional support.',
      layers: {
        // Tavus-hosted LLM for low-latency CVI turn-taking. Claude handles
        // deep content generation (scripture, insight summaries) separately.
        // NOTE: keep this block minimal — extra/invalid fields (e.g. perception
        // awareness-query arrays on accounts without Raven) cause Tavus to drop
        // the ENTIRE custom `layers` object, leaving the persona with no LLM and
        // the replica stuck on "Connecting".
        llm: {
          model: 'tavus-gpt-oss',
          speculative_inference: true,
          // Lets Lumina end the meeting herself (see ENDING THE SESSION in the
          // system prompt). Keep this schema valid — an invalid tool would make
          // Tavus drop the whole `layers` block (no LLM → stuck on "Connecting").
          tools: [END_SESSION_TOOL],
        },
        // Raven perception (mood/gaze) is included minimally; on accounts where
        // it isn't enabled, Tavus silently strips it and the app falls back to a
        // simulated mood — harmless for the demo.
        perception: {
          perception_model: 'raven-1',
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Persona creation failed:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('Persona created. Add this to .env.local:');
  console.log(`TAVUS_PERSONA_ID=${data.persona_id}`);
}

createPersona().catch((err) => {
  console.error(err);
  process.exit(1);
});
