// Structured post-session reflection produced by Claude from the transcript.
export interface SessionAnalysis {
  summary: string; // short narrative recap of the conversation
  themes: string[]; // key emotional/topical threads that surfaced
  advice: string[]; // concrete, actionable next steps
  affirmation: string; // a closing affirmation for the user
  tieIn: string; // gentle tie-in to today's astrology / scripture context
}

// A single line of the conversation, as sent to the analysis endpoint.
export interface TranscriptLine {
  role: 'user' | 'replica';
  text: string;
}
