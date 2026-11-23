import type {StationId} from './stations'
import type {HtmlAudioError, RadioPlayState} from './types'

/** What the mini-player and the sheet say when the station's last play failed. */
export const PLAYBACK_ERROR = 'Couldn’t play'

/** What a listener is told when the station they had loaded is switched off. */
export function switchedOffNotice(stationId: StationId): string {
	return `${stationId.toUpperCase()} isn’t available right now`
}

/** What the mini-player and the sheet say the station is doing. */
export function describePlayback(playState: RadioPlayState, error: HtmlAudioError | null): string {
	if (error) {
		return PLAYBACK_ERROR
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
