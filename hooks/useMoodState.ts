'use client';

import { useMemo, useState } from 'react';
import { MoodLabel } from '@/types/profile';

// Maps Raven emotion scores to a single dominant MoodLabel.
const EMOTION_TO_MOOD: Record<string, MoodLabel> = {
  happiness: 'joyful',
  joy: 'joyful',
  calm: 'calm',
  neutral: 'neutral',
  anxiety: 'anxious',
  fear: 'anxious',
  sadness: 'sad',
  anger: 'angry',
  disgust: 'angry',
  tiredness: 'tired',
};

export function dominantMood(emotions?: Record<string, number>): MoodLabel {
  if (!emotions || Object.keys(emotions).length === 0) return 'unknown';
  const [top] = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
  if (!top) return 'unknown';
  return EMOTION_TO_MOOD[top[0].toLowerCase()] ?? 'neutral';
}

/**
 * Local mood state for the session UI. Seeded with a value and updatable from
 * perception events relayed to the client.
 */
export function useMoodState(initial: MoodLabel = 'neutral') {
  const [emotions, setEmotions] = useState<Record<string, number> | undefined>(undefined);
  const [override, setOverride] = useState<MoodLabel | null>(initial);

  const mood = useMemo<MoodLabel>(() => {
    if (emotions) return dominantMood(emotions);
    return override ?? 'unknown';
  }, [emotions, override]);

  return {
    mood,
    setEmotions,
    setMood: (m: MoodLabel) => {
      setEmotions(undefined);
      setOverride(m);
    },
  };
}
