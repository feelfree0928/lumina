'use client';

import { ReligiousTradition } from '@/types/profile';
import { Button } from '@/components/ui/Button';

interface ReligionSelectorProps {
  value: ReligiousTradition;
  onChange: (v: ReligiousTradition) => void;
  onNext: () => void;
  onBack: () => void;
}

const TRADITIONS: { id: ReligiousTradition; label: string; icon: string; desc: string }[] = [
  { id: 'christianity', label: 'Christianity', icon: '✝️', desc: 'Bible & Gospel wisdom' },
  { id: 'islam', label: 'Islam', icon: '☪️', desc: 'Quranic guidance' },
  { id: 'judaism', label: 'Judaism', icon: '✡️', desc: 'Torah & Talmudic insight' },
  { id: 'hinduism', label: 'Hinduism', icon: '🕉️', desc: 'Vedic & Gita teachings' },
  { id: 'buddhism', label: 'Buddhism', icon: '☸️', desc: 'Dharma & mindfulness' },
  { id: 'sikhism', label: 'Sikhism', icon: '🪯', desc: 'Guru Granth Sahib' },
  { id: 'spiritual_nonreligious', label: 'Spiritual', icon: '✨', desc: 'Universal wisdom' },
  { id: 'agnostic', label: 'Philosophical', icon: '🌿', desc: 'Stoic & existential' },
];

export default function ReligionSelector({ value, onChange, onNext, onBack }: ReligionSelectorProps) {
  return (
    <div className="space-y-5 text-white">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-light">Your spiritual path</h2>
        <p className="text-white/50 text-sm">Lumina draws wisdom from your tradition.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TRADITIONS.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                active
                  ? 'border-violet-400 bg-violet-500/20 ring-2 ring-violet-400/50'
                  : 'border-white/10 bg-white/[0.04] hover:bg-white/10'
              }`}
            >
              <div className="text-2xl">{t.icon}</div>
              <div className="mt-2 font-medium">{t.label}</div>
              <div className="text-xs text-white/50">{t.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="subtle" className="flex-1" onClick={onBack} type="button">
          ← Back
        </Button>
        <Button className="flex-1" onClick={onNext} type="button">
          Continue →
        </Button>
      </div>
    </div>
  );
}
