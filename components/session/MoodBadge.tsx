import { MoodLabel } from '@/types/profile';

const MOOD_COLORS: Record<string, string> = {
  joyful: 'bg-yellow-400',
  calm: 'bg-teal-400',
  anxious: 'bg-orange-400',
  sad: 'bg-blue-400',
  angry: 'bg-red-500',
  tired: 'bg-slate-400',
  neutral: 'bg-violet-400',
  unknown: 'bg-white/30',
};

const MOOD_LABELS: Record<string, string> = {
  joyful: 'Joyful',
  calm: 'Calm',
  anxious: 'Anxious',
  sad: 'Tender',
  angry: 'Activated',
  tired: 'Tired',
  neutral: 'Present',
  unknown: 'Sensing…',
};

export default function MoodBadge({ mood }: { mood: MoodLabel }) {
  const color = MOOD_COLORS[mood] ?? MOOD_COLORS.unknown;
  const label = MOOD_LABELS[mood] ?? 'Sensing…';

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${color}`} />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
      </span>
      <span className="text-xs text-white/70">{label}</span>
    </div>
  );
}
