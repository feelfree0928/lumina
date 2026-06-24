'use client';

// A live microphone level meter for the pre-session device check. Analyses the
// preview MediaStream locally via Web Audio (no Daily) so it can run before any
// call exists. Lights bars proportionally to the input RMS level.
import { memo, useEffect, useRef } from 'react';

const BARS = 12;

export const MicMeter = memo(({ stream }: { stream: MediaStream | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const audioTracks = stream?.getAudioTracks() ?? [];
    if (!stream || audioTracks.length === 0) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      // RMS of the waveform centred on 128 → 0..~1.
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const el = containerRef.current;
      if (el) {
        const active = Math.round(Math.min(1, rms * 3.2) * BARS);
        for (let i = 0; i < el.children.length; i++) {
          (el.children[i] as HTMLElement).style.opacity = i < active ? '1' : '0.18';
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      source.disconnect();
      void ctx.close();
    };
  }, [stream]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40" aria-hidden="true">
        🎙
      </span>
      <div ref={containerRef} className="flex items-end gap-[3px] h-5" aria-label="Microphone level">
        {Array.from({ length: BARS }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-emerald-400 transition-opacity"
            style={{ height: `${30 + (i / BARS) * 70}%`, opacity: 0.18 }}
          />
        ))}
      </div>
    </div>
  );
});

MicMeter.displayName = 'MicMeter';
