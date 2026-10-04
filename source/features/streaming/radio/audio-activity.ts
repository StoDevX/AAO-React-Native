import type {AudioStatus} from 'expo-audio'

/** What the native player is doing, in the terms the radio's store cares about. */
export type AudioActivity = 'idle' | 'waiting' | 'playing' | 'ended' | 'error'

/**
 * Reads a native player's status as one thing it is doing. A failure outranks
 * the rest, since the player can report one with its other flags still set.
 */
export function audioActivity(
	status: Pick<AudioStatus, 'playing' | 'isBuffering' | 'didJustFinish' | 'error'>,
): AudioActivity {
	if (status.error !== null) {
		return 'error'
	}
	if (status.didJustFinish) {
		return 'ended'
	}
	if (status.isBuffering) {
		return 'waiting'
	}
	return status.playing ? 'playing' : 'idle'
}
