import type {SFSymbol} from 'expo-symbols'
import type {CaptionsEngineState} from '@frogpond/radio-captions'

/** The line shown above the captions; what it says aloud is what it shows. */
export type StatusLine = {text: string; spoken: string}

/** What the panel shows in place of an empty transcript: a symbol over a message. */
export type EmptyState = {symbol: SFSymbol; text: string}

/** Said in the empty view whenever there is nothing to caption yet, for whatever reason. */
const WAITING_TEXT = 'Captions appear when someone speaks'

/**
 * What the engine's state has to tell the viewer, or null when there is nothing
 * to say. Only a failure is news: starting up, reconnecting, music and a paused
 * station come and go while captions are on, and are not worth a word.
 */
function notice(engine: CaptionsEngineState | null): {text: string; symbol: SFSymbol} | null {
	return engine?.kind === 'unavailable'
		? {text: engine.reason, symbol: 'exclamationmark.circle'}
		: null
}

/**
 * What the captions panel says besides the transcript. A notice shows as a line
 * above the transcript, or, with no transcript yet, as the empty view instead.
 * With nothing to say and nothing said yet, the empty view says captions wait
 * for speech.
 */
export function captionPanelStatus({
	engine,
	hasLines,
}: {
	engine: CaptionsEngineState | null
	hasLines: boolean
}): {line: StatusLine | null; empty: EmptyState | null} {
	let shown = notice(engine)
	if (shown === null) {
		return {line: null, empty: hasLines ? null : {symbol: 'captions.bubble', text: WAITING_TEXT}}
	}
	return hasLines
		? {line: {text: shown.text, spoken: shown.text}, empty: null}
		: {line: null, empty: shown}
}
