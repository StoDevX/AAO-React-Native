import type {CaptionsEngineState} from '@frogpond/radio-captions'

/** A status line whose spoken form is its text. */
function say(text: string): {text: string; spoken: string} {
	return {text, spoken: text}
}

/** The line shown above the captions, or null when the captions say it all. */
export function captionStatus(
	state: CaptionsEngineState | null,
	hasLines: boolean,
): {text: string; spoken: string} | null {
	if (state === null) return say('Getting captions ready…')
	switch (state.kind) {
		case 'downloading':
			return say('Getting captions ready…')
		case 'reconnecting':
			return say('Reconnecting…')
		case 'music':
			return say('Music')
		case 'unavailable':
			return say(state.reason)
		case 'captioning':
			return hasLines ? null : say('Listening for speech…')
		default: {
			let _exhaustive: never = state
			throw new Error(`Unhandled captions state: ${JSON.stringify(_exhaustive)}`)
		}
	}
}
