'use client';

import { SessionAnalysis } from '@/types/analysis';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SessionAnalysisViewProps {
  analysis: SessionAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  onRestart: () => void;
}

export default function SessionAnalysisView({
  analysis,
  isAnalyzing,
  error,
  onRestart,
}: SessionAnalysisViewProps) {
  return (
    <div className="w-full h-full flex flex-col gap-3 p-4 min-h-0">
      <header className="flex-none flex items-center gap-2">
        <span className="text-lg">✦</span>
        <h2 className="text-lg font-light tracking-wide text-white">Session Reflection</h2>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1 space-y-4">
        {isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <div className="text-2xl mb-3 animate-pulse">✦</div>
            <p className="text-white/60 animate-pulse">Reflecting on our conversation…</p>
          </div>
        ) : analysis ? (
          <>
            {error && (
              <p className="text-amber-300/80 text-xs">
                {error} Showing a gentle reflection instead.
              </p>
            )}

            {/* Summary */}
            <Card>
              <p className="text-xs uppercase tracking-wide text-violet-300/70 mb-2">Summary</p>
              <p className="text-white/90 text-sm leading-relaxed">{analysis.summary}</p>
            </Card>

            {/* Key themes */}
            {analysis.themes.length > 0 && (
              <Card>
                <p className="text-xs uppercase tracking-wide text-violet-300/70 mb-3">Key themes</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.themes.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Actionable advice */}
            {analysis.advice.length > 0 && (
              <Card>
                <p className="text-xs uppercase tracking-wide text-violet-300/70 mb-3">
                  Advice &amp; next steps
                </p>
                <ol className="space-y-2.5">
                  {analysis.advice.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm text-white/85 leading-relaxed">
                      <span className="flex-none mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20 text-[11px] text-violet-200">
                        {i + 1}
                      </span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            {/* Affirmation + tie-in */}
            {(analysis.affirmation || analysis.tieIn) && (
              <Card className="bg-violet-500/[0.06] border-violet-400/20">
                <p className="text-xs uppercase tracking-wide text-violet-300/70 mb-2">
                  Carry this with you
                </p>
                {analysis.affirmation && (
                  <p className="text-white/90 text-sm italic leading-relaxed">
                    &ldquo;{analysis.affirmation}&rdquo;
                  </p>
                )}
                {analysis.tieIn && (
                  <p className="text-white/55 text-xs mt-3 leading-relaxed">{analysis.tieIn}</p>
                )}
              </Card>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-center py-16">
            <p className="text-white/50">No reflection available for this session.</p>
          </div>
        )}
      </div>

      <Button
        variant="subtle"
        className="flex-none"
        onClick={onRestart}
        disabled={isAnalyzing}
      >
        Start another session
      </Button>
    </div>
  );
}
