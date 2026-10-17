import type {HtmlAudioError, RadioPlayState} from './types'

/** What the mini-player and the sheet say when the station's last play failed. */
export const PLAYBACK_ERROR = 'Couldn’t play'

/** Adds the native reason for display, with a generic fallback for an empty message. */
export function describePlaybackError(error: HtmlAudioError): string {
	let message = error.message.trim()
	return message ? `${PLAYBACK_ERROR}: ${message}` : PLAYBACK_ERROR
}

/** What the mini-player and the sheet say the station is doing. */
export function describePlayback(playState: RadioPlayState, error: HtmlAudioError | null): string {
	if (error) {
		return describePlaybackError(error)
	}
	switch (playState) {
		case 'playing':
			return 'Playing'
		case 'starting':
			return 'Starting…'
		case 'paused':
			return 'Paused'
		default:
			return 'Stopped'
	}
}
