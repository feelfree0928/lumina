import { TavusPerceptionEvent } from '@/types/tavus';

// In-memory store for demo purposes. In production, use Redis or a DB.
// Kept out of the route module because Next.js route files may only export
// HTTP method handlers + route config.
export const perceptionStore = new Map<string, TavusPerceptionEvent['properties']>();
