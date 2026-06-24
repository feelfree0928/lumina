'use client';

// NOTE: @tavus/cvi-ui is a CLI that generates these components into the project.
// They live under app/components/cvi/ and are imported locally — NOT from an npm package.
import { CVIProvider } from '@/app/components/cvi/components/cvi-provider';
import { Conversation } from '@/app/components/cvi/components/conversation';
import Transcript from './Transcript';
import SessionEndDetector from './SessionEndDetector';
import PreferredDevices from './PreferredDevices';
import type { ChatMessage } from '@/app/components/cvi/hooks/use-chat';
import type { SelectedDevices } from './DeviceCheck';

interface TavusEmbedProps {
  conversationUrl: string;
  onLeave: () => void;
  onTranscript?: (messages: ChatMessage[]) => void;
  preferredDevices?: SelectedDevices | null;
}

export default function TavusEmbed({
  conversationUrl,
  onLeave,
  onTranscript,
  preferredDevices,
}: TavusEmbedProps) {
  return (
    // Both the video and the transcript must live inside one CVIProvider so the
    // transcript can read the same Daily app-message stream the call emits.
    <CVIProvider>
      {/* Watches the call + transcript: actually leaves when the meeting should
          end (user/Lumina asks, or Daily signals it's over), and lifts the
          transcript up so it survives teardown for the analysis view. */}
      <SessionEndDetector onEnded={onLeave} onTranscript={onTranscript} />
      {/* Applies the camera/mic chosen in the pre-session device check. */}
      <PreferredDevices devices={preferredDevices ?? null} />
      <div className="w-full h-full flex flex-col gap-3 p-3 min-h-0">
        <div className="flex-none rounded-2xl overflow-hidden">
          <Conversation conversationUrl={conversationUrl} onLeave={onLeave} />
        </div>
        {/* Left-down area: running transcript below the video. */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Transcript />
        </div>
      </div>
    </CVIProvider>
  );
}
