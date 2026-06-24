// lib/env.ts
// Server-side environment validation. Imported by API routes and server libs.
const required = [
  'TAVUS_API_KEY',
  'TAVUS_REPLICA_ID',
  'TAVUS_PERSONA_ID',
  'ANTHROPIC_API_KEY',
  'ASTROLOGY_API_USER_ID',
  'ASTROLOGY_API_KEY',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  tavus: {
    apiKey: process.env.TAVUS_API_KEY!,
    replicaId: process.env.TAVUS_REPLICA_ID!,
    personaId: process.env.TAVUS_PERSONA_ID!,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  astrology: {
    userId: process.env.ASTROLOGY_API_USER_ID!,
    apiKey: process.env.ASTROLOGY_API_KEY!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    webhookSecret: process.env.WEBHOOK_SECRET || '',
  },
};
