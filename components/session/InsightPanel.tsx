import { MoodLabel } from '@/types/profile';
import { DailyTransitResponse } from '@/types/astrology';
import { Card } from '@/components/ui/Card';
import MoodBadge from './MoodBadge';
import { greetingForHour } from '@/lib/utils';

interface InsightPanelProps {
  userName: string;
  astroInsight: DailyTransitResponse | null;
  scriptureContext: { passage: string; source: string; reflection: string } | null;
  detectedMood: MoodLabel;
}

export default function InsightPanel({
  userName,
  astroInsight,
  scriptureContext,
  detectedMood,
}: InsightPanelProps) {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Greeting + mood */}
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wide">{greetingForHour()}</p>
          <p className="text-lg font-light text-white">{userName}</p>
        </div>
        <MoodBadge mood={detectedMood} />
      </Card>

      {/* Astrology */}
      <Card>
        <p className="text-xs uppercase tracking-wide text-violet-300/70 mb-2">Today&apos;s theme</p>
        <p className="text-white/90 text-sm leading-relaxed">
          {astroInsight?.overall_theme ?? 'Tuning into your chart…'}
        </p>
        {astroInsight?.transits && astroInsight.transits.length > 0 && (
          <ul className="mt-3 space-y-2">
            {astroInsight.transits.slice(0, 3).map((t, i) => (
              <li key={i} className="text-xs text-white/55 leading-relaxed">
                <span className="text-white/80">
                  {t.planet} in {t.sign}
                </span>{' '}
                — {t.interpretation}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Scripture */}
      {scriptureContext && (
        <Card className="bg-violet-500/[0.06] border-violet-400/20">
          <p className="text-xs uppercase tracking-wide text-violet-300/70 mb-2">A passage for you</p>
          <p className="text-white/90 text-sm italic leading-relaxed">
            &ldquo;{scriptureContext.passage}&rdquo;
          </p>
          <p className="text-white/45 text-xs mt-2">{scriptureContext.source}</p>
          {scriptureContext.reflection && (
            <p className="text-white/60 text-xs mt-3 leading-relaxed">{scriptureContext.reflection}</p>
          )}
        </Card>
      )}
    </div>
  );
}
