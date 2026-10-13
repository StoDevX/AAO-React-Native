import type {TelemetryEvent} from '../../telemetry/catalog'
import type {StationId} from './stations'

/** Reviewed native messages that may be sent to telemetry; arbitrary text stays local. */
export type PlaybackFailureMessage =
	| 'Cannot Open'
	| 'The operation could not be completed.'
	| 'Could not connect to the server.'
	| 'Operation Stopped'
	| 'Some mysterious, uncataloged error'

/** Keeps only complete, cataloged messages, never native URLs or other incidental text. */
export function normalizePlaybackError(message: string): PlaybackFailureMessage {
	switch (message.trim()) {
		case 'Cannot Open':
			return 'Cannot Open'
		case 'The operation could not be completed.':
			return 'The operation could not be completed.'
		case 'Could not connect to the server.':
			return 'Could not connect to the server.'
		case 'Operation Stopped':
			return 'Operation Stopped'
		default:
			return 'Some mysterious, uncataloged error'
	}
}

type PlaybackSession = {stationId: StationId | null; playerKey: number}
type PlaybackFailure = Extract<TelemetryEvent, {name: 'radio.play.failure'}>

/**
 * One native source attempt. Retired sessions and repeated failure callbacks
 * cannot trigger another diagnostic or fallback. Each replacement source and
 * each user retry gets a fresh attempt.
 */
export function createPlaybackAttempt(
	session: {stationId: StationId; playerKey: number},
	streamUrl: string,
	shippedUrl: string,
): {
	reportPlaying: (current: PlaybackSession) => boolean
	reportFailure: (current: PlaybackSession, message: string) => PlaybackFailure | null
} {
	let played = false
	let failed = false
	let isCurrent = (current: PlaybackSession) =>
		!failed && current.stationId === session.stationId && current.playerKey === session.playerKey

	return {
		reportPlaying: (current) => {
			if (!isCurrent(current)) return false
			played = true
			return true
		},
		reportFailure: (current, message) => {
			if (!isCurrent(current)) return null
			failed = true
			const source = streamUrl === shippedUrl ? 'shipped' : 'published'
			return {
				name: 'radio.play.failure',
				attributes: {
					station: session.stationId,
					message: normalizePlaybackError(message),
					source,
					phase: played ? 'after_playback' : 'startup',
					outcome: !played && source === 'published' ? 'trying_fallback' : 'stopped',
				},
			}
		},
	}
}
