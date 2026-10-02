import type {HtmlAudioError, PlayState} from './types'

/** What the mini-player says the station is doing. */
export function describePlayback(playState: PlayState, error: HtmlAudioError | null): string {
	if (error) {
		return 'Couldn’t play'
	}
	switch (playState) {
		case 'playing':
			return 'Playing'
		case 'checking':
		case 'loading':
			return 'Starting…'
		default:
			return 'Paused'
	}
}
