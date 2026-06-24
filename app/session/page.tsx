'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTavusSession } from '@/hooks/useTavusSession';
import SessionShell from '@/components/session/SessionShell';

export default function SessionPage() {
  const router = useRouter();
  const { profile, isLoading } = useUserProfile();
  const {
    conversationUrl,
    phase,
    astroInsight,
    scriptureContext,
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
  } = useTavusSession(profile);

  useEffect(() => {
    if (!isLoading && !profile) {
      router.push('/');
    }
  }, [isLoading, profile, router]);

  if (isLoading || !profile) {
    return <LoadingScreen />;
  }

  return (
    <SessionShell
      profile={profile}
      conversationUrl={conversationUrl}
      phase={phase}
      astroInsight={astroInsight}
      scriptureContext={scriptureContext}
      isStarting={isStarting}
      error={error}
      analysis={analysis}
      analysisError={analysisError}
      endedTranscript={endedTranscript}
      preferredDevices={preferredDevices}
      onStart={startSession}
      onEnd={endSession}
      onTranscript={captureTranscript}
      onRestart={resetSession}
      onDevicesSelected={setPreferredDevices}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
      <div className="text-white/60 animate-pulse">Preparing your space…</div>
    </div>
  );
}
