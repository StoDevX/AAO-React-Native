import type {CaptionsState} from './reduce-captions'

/** A line as the view lists it. `key` is its React key and stays the same as the line settles. */
export type CaptionRow = {
	key: number
	text: string
	/** Whether it is the line still being spoken, which may be shown differently. */ live: boolean
}

/**
 * The lines to show: the settled ones by their ids, then the line being
 * spoken, if any. The spoken line takes `nextId`, the id the next final will
 * give it, so when it settles its row keeps its key and is not remounted.
 */
export function captionRows(state: CaptionsState): CaptionRow[] {
	let rows = state.lines.map((line) => ({key: line.id, text: line.text, live: false}))
	return state.live === '' ? rows : [...rows, {key: state.nextId, text: state.live, live: true}]
}

/** The words of a line, which fade in one at a time as the line grows. */
export function splitWords(text: string): string[] {
	return text.split(/\s+/u).filter((word) => word !== '')
}
