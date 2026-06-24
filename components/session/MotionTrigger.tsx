'use client';

import { Button } from '@/components/ui/Button';

interface MotionTriggerProps {
  onStart: (mood?: string) => void;
  isStarting: boolean;
}

// For the investor demo, this simulates a physical PIR motion sensor firing.
// In production, this is replaced by a WebSocket connection to hardware.
export default function MotionTrigger({ onStart, isStarting }: MotionTriggerProps) {
  return (
    <div className="text-center space-y-6 max-w-sm">
      <div className="text-5xl animate-float">✦</div>
      <div className="space-y-2">
        <h2 className="text-2xl font-light text-white">Lumina is ready</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          In the physical product, a motion sensor wakes Lumina as you approach. For the demo, trigger
          it manually.
        </p>
      </div>
      <Button
        className="w-full text-base py-4"
        onClick={() => onStart('neutral')}
        disabled={isStarting}
        type="button"
      >
        {isStarting ? 'Awakening Lumina…' : 'Simulate Motion Sensor'}
      </Button>
    </div>
  );
}
