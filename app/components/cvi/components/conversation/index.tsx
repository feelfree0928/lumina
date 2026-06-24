'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
	DailyAudioTrack,
	DailyVideo,
	useDaily,
	useDevices,
	useDailyEvent,
	useLocalSessionId,
	useMeetingState,
	useParticipantIds,
	useScreenVideoTrack,
	useVideoTrack,
} from '@daily-co/daily-react';
import { MicSelectBtn, CameraSelectBtn, ScreenShareButton } from '../device-select';
import { ClosedCaptions, ClosedCaptionsButton, ClosedCaptionsProvider } from '../closed-captions';
import { ChatButton, ChatPanel, ChatProvider } from '../chat';
import { ConnectingState, LeavingState } from '../conversation-status';
import { useLocalScreenshare } from '../../hooks/use-local-screenshare';
import { useReplicaIDs } from '../../hooks/use-replica-ids';
import { useCVICall } from '../../hooks/use-cvi-call';
import { AudioWave } from '../audio-wave';

import styles from './conversation.module.css';

interface ConversationProps {
	onLeave: () => void;
	conversationUrl: string;
}

// TEMP DEBUG: surfaces exactly why the avatar isn't appearing. Logs every
// participant's user_id, the detected replica ids, the meeting state, and any
// Daily error/system events. Remove once the connection issue is resolved.
const DebugProbe = React.memo(() => {
	const meetingState = useMeetingState();
	const allIds = useParticipantIds();
	const replicaIds = useReplicaIDs();
	const localId = useLocalSessionId();

	useEffect(() => {
		console.log('[lumina-debug] meetingState =', meetingState);
	}, [meetingState]);

	useEffect(() => {
		console.log(
			'[lumina-debug] participants =',
			allIds,
			'| localId =',
			localId,
			'| matched replicaIds =',
			replicaIds
		);
	}, [allIds, localId, replicaIds]);

	useDailyEvent(
		'participant-joined',
		useCallback((ev) => {
			console.log('[lumina-debug] participant-joined user_id =', ev?.participant?.user_id, ev?.participant);
		}, [])
	);
	useDailyEvent(
		'error',
		useCallback((ev) => console.error('[lumina-debug] daily ERROR =', ev), [])
	);
	useDailyEvent(
		'nonfatal-error',
		useCallback((ev) => console.warn('[lumina-debug] daily NONFATAL =', ev), [])
	);
	useDailyEvent(
		'app-message',
		useCallback((ev) => console.log('[lumina-debug] app-message =', ev?.data), [])
	);

	return null;
});

DebugProbe.displayName = 'DebugProbe';

const VideoPreview = React.memo(({ id }: { id: string }) => {
	const videoState = useVideoTrack(id);

	return (
		<div
			className={`${styles.previewVideoContainer} ${videoState.isOff ? styles.previewVideoContainerHidden : ''}`}
		>
			<DailyVideo
				automirror
				sessionId={id}
				type="video"
				fit="cover"
				className={`${styles.previewVideo} ${videoState.isOff ? styles.previewVideoHidden : ''}`}
			/>
			<div className={styles.audioWaveContainer}>
				<AudioWave id={id} />
			</div>
		</div>
	);
});

const PreviewVideos = React.memo(() => {
	const localId = useLocalSessionId();
	const { isScreenSharing } = useLocalScreenshare();
	const replicaIds = useReplicaIDs();
	const replicaId = replicaIds[0];

	return (
		<>
			{isScreenSharing && <VideoPreview id={replicaId} />}
			<VideoPreview id={localId} />
		</>
	);
});

const SelfView = React.memo(() => (
	<div className={styles.selfViewContainer}>
		<PreviewVideos />
	</div>
));

const MainVideo = React.memo(() => {
	const replicaIds = useReplicaIDs();
	const localId = useLocalSessionId();
	const videoState = useVideoTrack(replicaIds[0]);
	const screenVideoState = useScreenVideoTrack(localId);
	const meetingState = useMeetingState();
	const isScreenSharing = !screenVideoState.isOff;
	const replicaId = replicaIds[0];
	const [hasReplicaConnected, setHasReplicaConnected] = useState(false);

	useEffect(() => {
		if (replicaId && videoState.state === 'playable') {
			setHasReplicaConnected(true);
		}
	}, [replicaId, videoState.state]);

	if (meetingState === 'left-meeting' || meetingState === 'error') {
		return <LeavingState />;
	}

	if (!hasReplicaConnected) {
		return <ConnectingState />;
	}

	if (!replicaId) {
		return <ConnectingState />;
	}

	return (
		<div
			className={`${styles.mainVideoContainer} ${isScreenSharing ? styles.mainVideoContainerScreenSharing : ''}`}
		>
			<DailyVideo
				automirror
				sessionId={isScreenSharing ? localId : replicaId}
				type={isScreenSharing ? 'screenVideo' : 'video'}
				className={`${styles.mainVideo}
				${isScreenSharing ? styles.mainVideoScreenSharing : ''}
				${videoState.isOff ? styles.mainVideoHidden : ''}`}
			/>
			<DailyAudioTrack sessionId={replicaId} />
		</div>
	);
});

const MoreMenu = memo(() => {
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) {
			return;
		}
		const handlePointerDown = (e: PointerEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false);
			}
		};
		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKey);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKey);
		};
	}, [isOpen]);

	return (
		<div ref={ref} className={styles.moreMenu}>
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				aria-pressed={isOpen}
				aria-label={isOpen ? 'Close more controls' : 'More controls'}
				aria-haspopup="true"
				aria-expanded={isOpen}
				className={`${styles.moreButton} ${isOpen ? styles.moreButtonActive : ''}`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="5" cy="12" r="1.75" fill="currentColor" />
					<circle cx="12" cy="12" r="1.75" fill="currentColor" />
					<circle cx="19" cy="12" r="1.75" fill="currentColor" />
				</svg>
			</button>
			{isOpen && (
				<div className={styles.morePopover} role="menu">
					<ScreenShareButton />
					<ClosedCaptionsButton />
				</div>
			)}
		</div>
	);
});

MoreMenu.displayName = 'MoreMenu';

export const Conversation = React.memo(({ onLeave, conversationUrl }: ConversationProps) => {
	const daily = useDaily();
	const { joinCall, leaveCall } = useCVICall();
	const meetingState = useMeetingState();
	const { hasMicError } = useDevices();

	useEffect(() => {
		if (meetingState === 'error') {
			onLeave();
		}
	}, [meetingState, onLeave]);

	// Join exactly once, but ONLY after the Daily call object exists. On the
	// first render `useDaily()` can return null; calling `daily?.join()` then is
	// a silent no-op and the meeting stays stuck in state "new" forever (client
	// never enters the room, so the replica has nothing to join → "Connecting"
	// hangs). Gating on `daily` ensures we actually join once it's ready, and the
	// ref guard prevents StrictMode's double-invoke from joining twice.
	const hasJoinedRef = useRef(false);
	useEffect(() => {
		if (!daily || hasJoinedRef.current) {
			return;
		}
		hasJoinedRef.current = true;
		joinCall({ url: conversationUrl });
	}, [daily, conversationUrl, joinCall]);

	const handleLeave = useCallback(() => {
		leaveCall();
		onLeave();
	}, [leaveCall, onLeave]);

	return (
		<ClosedCaptionsProvider>
			<ChatProvider>
				<DebugProbe />
				<div className={styles.containerWrapper}>
					<div className={styles.container}>
						<div className={styles.videoContainer}>
							{hasMicError && (
								<div className={styles.errorContainer}>
									<p>
										Camera or microphone access denied. Please check your settings and try again.
									</p>
								</div>
							)}

							<div className={styles.mainVideoContainer}>
								<MainVideo />
							</div>

							<SelfView />

							<ClosedCaptions />
						</div>

						<ChatPanel />

						<div
							className={`${styles.footer} ${meetingState === 'left-meeting' ? styles.footerLeaving : ''}`}
							aria-hidden={meetingState === 'left-meeting'}
						>
							<div className={styles.footerControls}>
								<MicSelectBtn />
								<CameraSelectBtn />
								<MoreMenu />
								<ChatButton />
								<button type="button" className={styles.leaveButton} onClick={handleLeave}>
									<span className={styles.leaveButtonIcon}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											role="img"
											aria-label="Leave Call"
										>
											<path
												d="M18 6L6 18M6 6L18 18"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</ChatProvider>
		</ClosedCaptionsProvider>
	);
});
