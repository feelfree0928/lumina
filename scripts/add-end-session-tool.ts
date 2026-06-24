// scripts/add-end-session-tool.ts
// Adds (or replaces) the LLM function tools on an EXISTING Tavus persona, in
// place — no need to recreate the persona or swap TAVUS_PERSONA_ID.
//
// Run with:  npm run add-tools        (or: npx tsx scripts/add-end-session-tool.ts)
// Requires TAVUS_API_KEY and TAVUS_PERSONA_ID in .env.local.
//
// Tavus updates personas via JSON Patch (RFC 6902): a list of {op, path, value}
// operations. We set /layers/llm/tools, then read the persona back to confirm
// the layers block survived (an invalid tool makes Tavus silently drop the whole
// custom `layers` object → persona ends up with no LLM → replica stuck "Connecting").

import { config } from 'dotenv';
config({ path: '.env.local' });

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_PERSONA_ID = process.env.TAVUS_PERSONA_ID;

// ── Paste your tools here ───────────────────────────────────────────────────
// OpenAI-compatible function schema. For Lumina we only need `end_session`, but
// you can drop additional tool objects into this array the same way.
const TOOLS = [
  {
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
  },
];
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!TAVUS_API_KEY) {
    throw new Error('TAVUS_API_KEY is not set. Add it to .env.local first.');
  }
  if (!TAVUS_PERSONA_ID) {
    throw new Error('TAVUS_PERSONA_ID is not set. Add it to .env.local first.');
  }

  // JSON Patch: `add` on an object member creates it, or replaces it if present.
  const patch = [{ op: 'add', path: '/layers/llm/tools', value: TOOLS }];

  const res = await fetch(`https://tavusapi.com/v2/personas/${TAVUS_PERSONA_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': TAVUS_API_KEY,
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Patch failed (HTTP ${res.status}):`, body);
    process.exit(1);
  }
  console.log(`✓ Patched persona ${TAVUS_PERSONA_ID} with ${TOOLS.length} tool(s).`);

  // Verify the layers block survived the update.
  const check = await fetch(`https://tavusapi.com/v2/personas/${TAVUS_PERSONA_ID}`, {
    headers: { 'x-api-key': TAVUS_API_KEY },
  });
  const persona = await check.json().catch(() => ({}));
  const llm = persona?.layers?.llm;
  const toolNames: string[] = Array.isArray(llm?.tools)
    ? llm.tools.map((t: { function?: { name?: string } }) => t?.function?.name).filter(Boolean)
    : [];

  if (!llm) {
    console.error(
      '⚠ Persona has NO layers.llm after the patch — Tavus likely rejected the tool schema and ' +
        'dropped the layers block. The replica will get stuck on "Connecting". Re-check the TOOLS schema.'
    );
    process.exit(1);
  }
  if (toolNames.length === 0) {
    console.error('⚠ layers.llm exists but has no tools — the patch did not take. Check the API response above.');
    process.exit(1);
  }

  console.log(`✓ Verified. layers.llm.model = ${llm.model}; tools = [${toolNames.join(', ')}]`);
  console.log('Done. Restart the app and the persona will call end_session to end the meeting itself.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
