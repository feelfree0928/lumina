'use client';

// Detects that the conversation should end and ACTUALLY ends it, and lifts the
// transcript up so it survives the call being torn down (for the analysis view).
//
// Without this, "end the meeting" only ever produces words — the avatar says
// "I'm ending the meeting now" but nothing leaves the call, so it runs forever.
//
// Ends on ANY of:
//   - A Tavus `conversation.tool_call` named `end_session` (if the persona is
//     configured with that tool — the cleanest signal).
//   - Daily/Tavus signalling the meeting is already over (left-meeting / error).
//   - The user explicitly asking to end ("please end this meeting", "goodbye"…).
//   - Lumina (the replica) declaring it's ending / saying its farewell — with a
//     short grace period so it can finish speaking.
//
// IMPORTANT: once an end is *armed*, it is NEVER cancelled by later messages.
// (The previous version scheduled the end inside an effect whose cleanup ran on
// every new message, so the avatar's own reply disarmed the user's request and
// the call never ended.)
//
// MUST be rendered inside <CVIProvider> (needs Daily + the utterance stream).
import { useCallback, useEffect, useRef } from 'react';
import { useMeetingState } from '@daily-co/daily-react';
import { useCVICall } from '@/app/components/cvi/hooks/use-cvi-call';
import { useChat, type ChatMessage } from '@/app/components/cvi/hooks/use-chat';
import { useObservableEvent } from '@/app/components/cvi/hooks/cvi-events-hooks';

// User explicitly asks to end. Anchored on an end-verb + a session noun, plus
// common standalone farewells, so ordinary talk doesn't trip it.
const USER_END_RE =
  /\b(end|stop|finish|close|leave|exit|quit|terminate|hang\s*up)\b[\s\w'’,.\-]*\b(meeting|call|session|conversation|chat|talk)\b|\b(that'?s\s+all|i'?m\s+done|we'?re\s+done|good\s*bye|see\s+you|let'?s\s+(stop|end)|no\s+more\s+advice)\b/i;

// Lumina announces it is ending / saying goodbye.
const REPLICA_END_RE =
  /\b(ending the meeting|end the meeting|i'?m ending|i am ending|i'?ll end|wrap(ping)?\s*(this|it|things|up)|we'?ll wrap up|ending (our|the|this) (call|session|conversation|meeting)|step(ping)? back now|good\s*bye|take care( of yourself)?|until next time|farewell)\b/i;

// Let Lumina finish its goodbye before we cut the call.
const REPLICA_GRACE_MS = 4500;
// User gave a direct command — end promptly, but allow a brief closing reply.
const USER_GRACE_MS = 2500;

interface SessionEndDetectorProps {
  onEnded: () => void;
  onTranscript?: (messages: ChatMessage[]) => void;
}

export default function SessionEndDetector({ onEnded, onTranscript }: SessionEndDetectorProps) {
  const meetingState = useMeetingState();
  const { leaveCall } = useCVICall();
  const { messages } = useChat();
  const endedRef = useRef(false);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    // Leave the live Daily room, then bubble up so the session is torn down and
    // the Tavus conversation is ended server-side.
    try {
      leaveCall();
    } catch {
      // best-effort — onEnded still tears the session down
    }
    onEnded();
  }, [leaveCall, onEnded]);

  // Arm a one-shot end. Once armed it is committed — later messages can't cancel it.
  const armEnd = useCallback(
    (delay: number) => {
      if (endedRef.current || pendingTimerRef.current) return;
      pendingTimerRef.current = setTimeout(fire, delay);
    },
    [fire]
  );

  // Lift the transcript up to the page so it outlives this component's unmount.
  useEffect(() => {
    onTranscript?.(messages);
  }, [messages, onTranscript]);

  // Cleanest signal: the LLM called an `end_session` tool (if configured on the
  // persona). Tavus may surface the name directly on properties or nested under
  // `function`, so check both shapes.
  useObservableEvent<unknown>(
    useCallback(
      (event) => {
        if (event.event_type !== 'conversation.tool_call') return;
        const props = (event as { properties?: { name?: string; function?: { name?: string } } })
          .properties;
        const name = props?.name ?? props?.function?.name;
        if (name === 'end_session' || name === 'end_call' || name === 'end_conversation') {
          fire();
        }
      },
      [fire]
    )
  );

  // Natural end already signalled by Daily/Tavus (max duration, kicked, error…).
  useEffect(() => {
    if (meetingState === 'left-meeting' || meetingState === 'error') {
      fire();
    }
  }, [meetingState, fire]);

  // Intent from the transcript. Scan only the most recent lines (the current
  // moment's intent) and arm-once; arming is idempotent and never cancelled.
  useEffect(() => {
    if (endedRef.current || pendingTimerRef.current) return;
    const recent = messages.slice(-3);
    for (const m of recent) {
      if (!m?.text) continue;
      if (m.role === 'user' && USER_END_RE.test(m.text)) {
        armEnd(USER_GRACE_MS);
        return;
      }
      if (m.role === 'replica' && REPLICA_END_RE.test(m.text)) {
        armEnd(REPLICA_GRACE_MS);
        return;
      }
    }
  }, [messages, armEnd]);

  // Clear the pending timer only on unmount.
  useEffect(
    () => () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
      }
    },
    []
  );

  return null;
}
