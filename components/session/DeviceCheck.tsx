'use client';

// Pre-session device gate. Previews the camera + mic and only enables "Begin"
// once both are granted and a device is selected for each, so a Tavus
// conversation is never created with broken A/V.
//
// IMPORTANT: this uses native browser media APIs (getUserMedia / enumerateDevices
// / Web Audio) and deliberately does NOT create a Daily call object. Daily.js
// permits only one call object per page; the live session (TavusEmbed) owns it.
// A second Daily instance here caused the session's instance to fail to create
// ("Duplicate DailyIframe instances are not allowed"), leaving it stuck on
// "Connecting". The preview's tracks are stopped before the session starts so it
// can acquire the camera cleanly.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MicMeter } from './MicMeter';

export interface SelectedDevices {
  videoDeviceId: string;
  audioDeviceId: string;
}

interface DeviceCheckProps {
  onStart: (mood?: string) => void;
  isStarting: boolean;
  error: string | null;
  onDevicesSelected: (devices: SelectedDevices) => void;
}

type Permission = 'prompt' | 'granted' | 'blocked' | 'no-device';

const selectClass =
  'w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-violet-400/40 disabled:opacity-40';

function StatusRow({ label, ok, blocked }: { label: string; ok: boolean; blocked: boolean }) {
  const text = ok ? 'Ready' : blocked ? 'Blocked / not found' : 'Waiting for permission…';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <span className={ok ? 'text-emerald-300' : blocked ? 'text-rose-300' : 'text-amber-300/90'}>
        {ok ? '✓ ' : blocked ? '✕ ' : '… '}
        {text}
      </span>
    </div>
  );
}

export default function DeviceCheck({ onStart, isStarting, error, onDevicesSelected }: DeviceCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedRef = useRef(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<Permission>('prompt');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamId, setSelectedCamId] = useState('');
  const [selectedMicId, setSelectedMicId] = useState('');
  const [retrying, setRetrying] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const acquire = useCallback(
    async (camId?: string, micId?: string) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setPermission('no-device');
        return;
      }
      stopStream();
      try {
        const next = await navigator.mediaDevices.getUserMedia({
          video: camId ? { deviceId: { exact: camId } } : true,
          audio: micId ? { deviceId: { exact: micId } } : true,
        });
        streamRef.current = next;
        setStream(next);
        setPermission('granted');

        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === 'videoinput');
        const mics = devices.filter((d) => d.kind === 'audioinput');
        setCameras(cams);
        setMicrophones(mics);

        const vId = next.getVideoTracks()[0]?.getSettings().deviceId || cams[0]?.deviceId || '';
        const aId = next.getAudioTracks()[0]?.getSettings().deviceId || mics[0]?.deviceId || '';
        setSelectedCamId(vId);
        setSelectedMicId(aId);
      } catch (err) {
        const name = (err as DOMException)?.name;
        setPermission(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no-device' : 'blocked');
        setStream(null);
      }
    },
    [stopStream]
  );

  // Acquire once on mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void acquire();
  }, [acquire]);

  // Attach the preview stream to the <video>.
  useEffect(() => {
    const v = videoRef.current;
    if (v && stream) {
      v.srcObject = stream;
      void v.play().catch(() => {});
    }
  }, [stream]);

  // Release the camera/mic when leaving the check.
  useEffect(() => () => stopStream(), [stopStream]);

  const onChangeCam = useCallback(
    (id: string) => {
      setSelectedCamId(id);
      void acquire(id, selectedMicId || undefined);
    },
    [acquire, selectedMicId]
  );
  const onChangeMic = useCallback(
    (id: string) => {
      setSelectedMicId(id);
      void acquire(selectedCamId || undefined, id);
    },
    [acquire, selectedCamId]
  );

  const onRetry = useCallback(async () => {
    setRetrying(true);
    await acquire();
    setRetrying(false);
  }, [acquire]);

  const granted = permission === 'granted';
  const failed = permission === 'blocked' || permission === 'no-device';
  const hasCam = !!selectedCamId && cameras.length > 0;
  const hasMic = !!selectedMicId && microphones.length > 0;
  const isReady = granted && hasCam && hasMic;

  const handleBegin = useCallback(() => {
    if (!isReady) return;
    onDevicesSelected({ videoDeviceId: selectedCamId, audioDeviceId: selectedMicId });
    // Release the preview camera so the live session can acquire it.
    stopStream();
    setStream(null);
    onStart('neutral');
  }, [isReady, selectedCamId, selectedMicId, onDevicesSelected, stopStream, onStart]);

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-5">
      <div className="text-center space-y-1.5">
        <div className="text-4xl animate-float">✦</div>
        <h2 className="text-2xl font-light text-white">Let&apos;s get you set up</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          Check your camera and sound before we begin. Lumina sees and hears you to respond with care.
        </p>
      </div>

      {/* Camera preview */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover -scale-x-100 ${granted ? '' : 'hidden'}`}
        />
        {!granted && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <p className="text-white/50 text-sm">
              {permission === 'blocked'
                ? 'Camera is blocked. Allow access in your browser, then Retry.'
                : permission === 'no-device'
                  ? 'No camera or microphone was found.'
                  : 'Waiting for camera permission…'}
            </p>
          </div>
        )}
        {granted && (
          <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-1 backdrop-blur-sm">
            <MicMeter stream={stream} />
          </div>
        )}
      </div>

      {/* Device pickers */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wide text-white/40">Camera</label>
          <select
            className={selectClass}
            value={selectedCamId}
            disabled={!granted || cameras.length === 0}
            onChange={(e) => onChangeCam(e.target.value)}
          >
            {cameras.length === 0 && <option value="">No camera</option>}
            {cameras.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wide text-white/40">Microphone</label>
          <select
            className={selectClass}
            value={selectedMicId}
            disabled={!granted || microphones.length === 0}
            onChange={(e) => onChangeMic(e.target.value)}
          >
            {microphones.length === 0 && <option value="">No microphone</option>}
            {microphones.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <StatusRow label="Camera" ok={granted && hasCam} blocked={failed || (granted && !hasCam)} />
        <StatusRow label="Microphone" ok={granted && hasMic} blocked={failed || (granted && !hasMic)} />
      </div>

      {failed && (
        <Button variant="subtle" className="w-full" onClick={onRetry} disabled={retrying} type="button">
          {retrying ? 'Retrying…' : 'Retry access'}
        </Button>
      )}

      <Button
        className="w-full text-base py-4"
        onClick={handleBegin}
        disabled={!isReady || isStarting}
        type="button"
      >
        {isStarting ? 'Awakening Lumina…' : isReady ? 'Begin session' : 'Camera & mic required'}
      </Button>

      {error && <p className="text-rose-300 text-sm text-center">{error}</p>}
    </div>
  );
}
