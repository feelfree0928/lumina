'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, BirthDetails, ReligiousTradition } from '@/types/profile';
import { generateProfileId } from '@/lib/profile';
import BirthDetailsForm from './BirthDetailsForm';
import ReligionSelector from './ReligionSelector';
import UpliftLibrary from './UpliftLibrary';

const STEPS = ['Welcome', 'Birth Details', 'Spiritual Path', 'Your Words'] as const;

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [birthDetails, setBirthDetails] = useState<BirthDetails | null>(null);
  const [religion, setReligion] = useState<ReligiousTradition>('spiritual_nonreligious');
  const [affirmations, setAffirmations] = useState<string[]>([]);

  const handleComplete = () => {
    if (!birthDetails) return;
    const profile: UserProfile = {
      id: generateProfileId(),
      name,
      birthDetails,
      religion,
      customAffirmations: affirmations,
      createdAt: new Date().toISOString(),
    };
    onComplete(profile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
      <div className="w-full max-w-lg px-6 py-10">
        {/* Step indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-violet-400 w-8' : 'bg-white/20 w-4'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <WelcomeStep name={name} onChange={setName} onNext={() => setStep(1)} />}
            {step === 1 && (
              <BirthDetailsForm
                onChange={setBirthDetails}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <ReligionSelector
                value={religion}
                onChange={setReligion}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <UpliftLibrary
                affirmations={affirmations}
                onChange={setAffirmations}
                onComplete={handleComplete}
                onBack={() => setStep(2)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeStep({
  name,
  onChange,
  onNext,
}: {
  name: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6 text-center text-white">
      <div className="text-5xl">✦</div>
      <h1 className="text-3xl font-light tracking-wide">Welcome to Lumina</h1>
      <p className="text-white/60 text-sm leading-relaxed">
        Your personal AI companion for self-discovery, emotional clarity, and spiritual grounding.
      </p>
      <input
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-400 text-center text-lg"
        placeholder="What is your name?"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onNext()}
      />
      <button
        onClick={onNext}
        disabled={!name.trim()}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl py-3 font-medium transition-all"
      >
        Begin →
      </button>
    </div>
  );
}
