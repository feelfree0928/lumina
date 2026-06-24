'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface UpliftLibraryProps {
  affirmations: string[];
  onChange: (a: string[]) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function UpliftLibrary({
  affirmations,
  onChange,
  onComplete,
  onBack,
}: UpliftLibraryProps) {
  const [text, setText] = useState('');

  const commit = () => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length) {
      onChange([...affirmations, ...lines]);
      setText('');
    }
  };

  const remove = (i: number) => {
    onChange(affirmations.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-5 text-white">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-light">Your words</h2>
        <p className="text-white/50 text-sm">
          Affirmations Lumina can offer you when the moment calls for uplift. One per line.
        </p>
      </div>

      <textarea
        className="w-full h-28 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
        placeholder={'I am exactly where I need to be.\nI am allowed to rest.'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end">
        <Button variant="subtle" type="button" onClick={commit} disabled={!text.trim()}>
          Add
        </Button>
      </div>

      {affirmations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {affirmations.map((a, i) => (
            <span
              key={`${a}-${i}`}
              className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 border border-violet-400/30 px-3 py-1 text-sm"
            >
              {a}
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-white/50 hover:text-white"
                aria-label="Remove affirmation"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="subtle" className="flex-1" onClick={onBack} type="button">
          ← Back
        </Button>
        <Button className="flex-1" onClick={onComplete} type="button">
          {affirmations.length ? 'Enter Lumina →' : 'Skip for now →'}
        </Button>
      </div>
    </div>
  );
}
