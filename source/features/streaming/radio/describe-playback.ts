import type {HtmlAudioError, RadioPlayState} from './types'

/** What the mini-player and the sheet say the station is doing. */
export function describePlayback(playState: RadioPlayState, error: HtmlAudioError | null): string {
	if (error) {
		return 'Couldn’t play'
	}
	switch (playState) {
		case 'playing':
			return 'Playing'
		case 'starting':
			return 'Starting…'
		default:
			return 'Stopped'
	}
}
