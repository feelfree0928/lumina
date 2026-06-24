'use client';

// Carries the camera/mic the user picked in the pre-session DeviceCheck into the
// live call. The check and the call use SEPARATE Daily call objects, so device
// selection doesn't transfer automatically — we re-apply it here once the call
// has joined. Rendered inside the session's <CVIProvider>; renders nothing.
import { useEffect, useRef } from 'react';
import { useDaily, useMeetingState } from '@daily-co/daily-react';
import type { SelectedDevices } from './DeviceCheck';

interface PreferredDevicesProps {
  devices: SelectedDevices | null;
}

export default function PreferredDevices({ devices }: PreferredDevicesProps) {
  const daily = useDaily();
  const meetingState = useMeetingState();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current || !daily || !devices) return;
    if (meetingState !== 'joining-meeting' && meetingState !== 'joined-meeting') return;
    appliedRef.current = true;
    daily
      .setInputDevicesAsync({
        videoDeviceId: devices.videoDeviceId,
        audioDeviceId: devices.audioDeviceId,
      })
      .catch(() => {
        // best-effort — the call still works with default devices
      });
  }, [daily, devices, meetingState]);

  return null;
}
