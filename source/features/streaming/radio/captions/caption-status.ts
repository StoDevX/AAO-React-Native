import type {SFSymbol} from 'expo-symbols'
import type {CaptionsEngineState} from '@frogpond/radio-captions'

/** The line shown above the captions; what it says aloud is what it shows. */
export type StatusLine = {text: string; spoken: string}

/** What the panel shows in place of an empty transcript: a symbol over a message. */
export type EmptyState = {symbol: SFSymbol; text: string}

/** Said while the captions are not running, whatever the engine last reported. */
const PAUSED_TEXT = 'Captions resume when the station plays'

/** Said while the engine has nothing to caption yet. */
const WAITING_TEXT = 'Captions appear when someone speaks'

/** What the engine's state has to tell the viewer, or null when there is nothing to say. */
function notice(
	engine: CaptionsEngineState | null,
	running: boolean,
): {text: string; symbol: SFSymbol} | null {
	if (!running) return {text: PAUSED_TEXT, symbol: 'pause.circle'}
	if (engine === null) return {text: 'Getting captions ready…', symbol: 'arrow.down.circle'}
	switch (engine.kind) {
		case 'downloading':
			return {text: 'Getting captions ready…', symbol: 'arrow.down.circle'}
		case 'reconnecting':
			return {text: 'Reconnecting…', symbol: 'wifi.exclamationmark'}
		case 'unavailable':
			return {text: engine.reason, symbol: 'exclamationmark.circle'}
		case 'captioning':
		case 'music':
			return null
		default: {
			let _exhaustive: never = engine
			throw new Error(`Unhandled captions state: ${JSON.stringify(_exhaustive)}`)
		}
	}
}

/**
 * What the captions panel says besides the transcript. A notice shows as a line
 * above the transcript, or, with no transcript yet, as the empty view instead.
 * Music is no notice: it is marked in the transcript. With nothing to say and
 * nothing said yet, the empty view says captions wait for speech.
 */
export function captionPanelStatus({
	engine,
	running,
	hasLines,
}: {
	engine: CaptionsEngineState | null
	running: boolean
	hasLines: boolean
}): {line: StatusLine | null; empty: EmptyState | null} {
	let shown = notice(engine, running)
	if (shown === null) {
		return {line: null, empty: hasLines ? null : {symbol: 'captions.bubble', text: WAITING_TEXT}}
	}
	return hasLines
		? {line: {text: shown.text, spoken: shown.text}, empty: null}
		: {line: null, empty: shown}
}
