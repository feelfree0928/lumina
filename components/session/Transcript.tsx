'use client';

// Two pieces:
//   - TranscriptView: presentational, takes messages as a prop. No Daily/CVI
//     dependency, so it can render a STATIC transcript after the call ended.
//   - Transcript (default): the LIVE wrapper — subscribes via useChat() and must
//     be rendered inside <CVIProvider>.
import { useEffect, useRef } from 'react';
import { useChat } from '@/app/components/cvi/hooks/use-chat';

export interface TranscriptItem {
  role: 'user' | 'replica';
  text: string;
}

function speakerLabel(role: TranscriptItem['role']): string {
  return role === 'user' ? 'You' : 'Lumina';
}

interface TranscriptViewProps {
  messages: TranscriptItem[];
  // false → static/ended transcript (changes the empty-state copy + count label).
  live?: boolean;
}

export function TranscriptView({ messages, live = true }: TranscriptViewProps) {
  const scrollRef = useRef<HTMLOListElement | null>(null);
  const lastText = messages[messages.length - 1]?.text;

  // Keep the latest line in view as the conversation streams in.
  useEffect(() => {
    if (!live) return;
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, lastText, live]);

  return (
    <div className="flex h-full flex-col min-h-0 rounded-2xl border border-white/10 bg-black/30">
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
        <span className="text-sm font-light tracking-wide text-white/80">Transcript</span>
        <span className="text-xs text-white/30">
          {messages.length > 0 ? `${messages.length} lines` : live ? 'listening…' : 'no transcript'}
        </span>
      </header>

      <ol
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3 text-sm"
        role="log"
        aria-live={live ? 'polite' : 'off'}
        aria-label="Conversation transcript"
      >
        {messages.length === 0 ? (
          <li className="text-white/30 italic">
            {live ? 'Your conversation with Lumina will appear here…' : 'This session had no transcript.'}
          </li>
        ) : (
          messages.map((m, i) => (
            <li key={i} className="leading-relaxed">
              <span
                className={
                  m.role === 'user' ? 'font-medium text-sky-300' : 'font-medium text-amber-200'
                }
              >
                {speakerLabel(m.role)}
              </span>
              <span className="text-white/40"> · </span>
              <span className="text-white/85">{m.text}</span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}

export default function Transcript() {
  const { messages } = useChat();
  return <TranscriptView messages={messages} live />;
}
