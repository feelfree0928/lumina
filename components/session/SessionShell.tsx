'use client';

import type { ChatMessage } from '@/app/components/cvi/hooks/use-chat';
import { UserProfile } from '@/types/profile';
import { DailyTransitResponse } from '@/types/astrology';
import { SessionAnalysis as SessionAnalysisType, TranscriptLine } from '@/types/analysis';
import { SessionPhase } from '@/hooks/useTavusSession';
import { useMoodState } from '@/hooks/useMoodState';
import InsightPanel from './InsightPanel';
import TavusEmbed from './TavusEmbed';
import SessionAnalysisView from './SessionAnalysis';
import { TranscriptView } from './Transcript';
import DeviceCheck, { type SelectedDevices } from './DeviceCheck';

interface ScriptureContext {
  passage: string;
  source: string;
  reflection: string;
}

interface SessionShellProps {
  profile: UserProfile;
  conversationUrl: string | null;
  phase: SessionPhase;
  astroInsight: DailyTransitResponse | null;
  scriptureContext: ScriptureContext | null;
  isStarting: boolean;
  error: string | null;
  analysis: SessionAnalysisType | null;
  analysisError: string | null;
  endedTranscript: TranscriptLine[];
  preferredDevices: SelectedDevices | null;
  onStart: (mood?: string) => void;
  onEnd: () => void;
  onTranscript: (messages: ChatMessage[]) => void;
  onRestart: () => void;
  onDevicesSelected: (devices: SelectedDevices) => void;
}

export default function SessionShell({
  profile,
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
  onStart,
  onEnd,
  onTranscript,
  onRestart,
  onDevicesSelected,
}: SessionShellProps) {
  const { mood } = useMoodState('neutral');
  const isPostSession = phase === 'analyzing' || phase === 'analysis';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 h-screen flex flex-col">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✦</span>
            <span className="text-lg font-light tracking-wide">Lumina</span>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-1 gap-4 min-h-0">
          {/* Left: live avatar+transcript, OR post-session reflection+transcript, OR start */}
          <section
            className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/30 overflow-hidden min-h-[50vh] flex items-stretch justify-center"
          >
            {conversationUrl ? (
              <TavusEmbed
                conversationUrl={conversationUrl}
                onLeave={onEnd}
                onTranscript={onTranscript}
                preferredDevices={preferredDevices}
              />
            ) : isPostSession ? (
              <div className="w-full h-full flex flex-col gap-3 p-3 min-h-0">
                {/* Reflection replaces the video; transcript stays below it. */}
                <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-black/20">
                  <SessionAnalysisView
                    analysis={analysis}
                    isAnalyzing={phase === 'analyzing'}
                    error={analysisError}
                    onRestart={onRestart}
                  />
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <TranscriptView messages={endedTranscript} live={false} />
                </div>
              </div>
            ) : (
              <div className="w-full overflow-y-auto scrollbar-thin py-6">
                <DeviceCheck
                  onStart={onStart}
                  isStarting={isStarting}
                  error={error}
                  onDevicesSelected={onDevicesSelected}
                />
              </div>
            )}
          </section>

          {/* Right: insights */}
          <aside className="lg:col-span-1 min-h-0">
            <InsightPanel
              userName={profile.name}
              astroInsight={astroInsight}
              scriptureContext={scriptureContext}
              detectedMood={mood}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
