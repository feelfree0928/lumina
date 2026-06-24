'use client';

import { useState, useCallback, useRef } from 'react';
import { UserProfile } from '@/types/profile';
import { DailyTransitResponse } from '@/types/astrology';
import { SessionAnalysis, TranscriptLine } from '@/types/analysis';
import type { SelectedDevices } from '@/components/session/DeviceCheck';

interface ScriptureContext {
  passage: string;
  source: string;
  reflection: string;
}

interface SessionData {
  conversationUrl: string | null;
  astroInsight: DailyTransitResponse | null;
  scriptureContext: ScriptureContext | null;
}

export type SessionPhase = 'idle' | 'live' | 'analyzing' | 'analysis';

/**
 * Drives a Tavus conversation session and the post-session reflection.
 * Phases: idle → live → analyzing → analysis → (reset) idle.
 */
export function useTavusSession(profile: UserProfile | null) {
  const [data, setData] = useState<SessionData>({
    conversationUrl: null,
    astroInsight: null,
    scriptureContext: null,
  });
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [endedTranscript, setEndedTranscript] = useState<TranscriptLine[]>([]);
  // Camera/mic chosen in the pre-session device check, applied when the call joins.
  const [preferredDevices, setPreferredDevices] = useState<SelectedDevices | null>(null);

  // Held in refs so endSession can read them without being recreated, and so a
  // double end-trigger (e.g. user command + Lumina's closing) only ends once.
  const conversationIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<TranscriptLine[]>([]);
  const endingRef = useRef(false);

  const startSession = useCallback(
    async (detectedMood = 'neutral') => {
      if (!profile) return;
      setIsStarting(true);
      setError(null);
      setAnalysis(null);
      setAnalysisError(null);
      setEndedTranscript([]);
      transcriptRef.current = [];
      endingRef.current = false;

      try {
        const res = await fetch('/api/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, mood: detectedMood }),
        });

        if (!res.ok) throw new Error('Failed to start session');

        const json = await res.json();
        conversationIdRef.current = json.conversationId ?? null;
        setData({
          conversationUrl: json.conversationUrl,
          astroInsight: json.astroInsight,
          scriptureContext: json.scriptureContext,
        });
        setPhase('live');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setIsStarting(false);
      }
    },
    [profile]
  );

  // Records the latest transcript so it outlives the call being torn down.
  const captureTranscript = useCallback((messages: { role: 'user' | 'replica'; text: string }[]) => {
    transcriptRef.current = messages.map((m) => ({ role: m.role, text: m.text }));
  }, []);

  const endSession = useCallback(() => {
    // Guard: repeated end triggers (user command + Lumina's goodbye) run once.
    if (endingRef.current) return;
    endingRef.current = true;

    const id = conversationIdRef.current;
    conversationIdRef.current = null;

    const transcript = transcriptRef.current;
    setEndedTranscript(transcript);

    // Tear the live call down immediately and switch to the analyzing view.
    setData((d) => ({ ...d, conversationUrl: null }));
    setPhase('analyzing');
    setAnalysisError(null);

    // End the Tavus conversation server-side so the replica actually disconnects
    // (best-effort, fire-and-forget).
    if (id) {
      fetch('/api/conversation/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      }).catch(() => {
        /* best-effort */
      });
    }

    // Generate the post-session reflection.
    fetch('/api/session-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        userName: profile?.name,
        religion: profile?.religion,
        theme: data.astroInsight?.overall_theme,
        scripturePassage: data.scriptureContext?.passage,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to analyze session');
        const json = await res.json();
        setAnalysis(json.analysis ?? null);
      })
      .catch((err) => {
        setAnalysisError(
          err instanceof Error ? err.message : 'Could not generate the reflection.'
        );
        setAnalysis(null);
      })
      .finally(() => {
        setPhase('analysis');
      });
  }, [profile, data.astroInsight, data.scriptureContext]);

  const resetSession = useCallback(() => {
    endingRef.current = false;
    conversationIdRef.current = null;
    transcriptRef.current = [];
    setAnalysis(null);
    setAnalysisError(null);
    setEndedTranscript([]);
    setError(null);
    setData({ conversationUrl: null, astroInsight: null, scriptureContext: null });
    setPhase('idle');
  }, []);

  return {
    ...data,
    phase,
    isStarting,
    error,
    analysis,
    analysisError,
    endedTranscript,
    preferredDevices,
    setPreferredDevices,
    startSession,
    endSession,
    resetSession,
    captureTranscript,
  };
}
