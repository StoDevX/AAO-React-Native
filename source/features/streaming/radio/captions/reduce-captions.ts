import type {CaptionEvent} from '@frogpond/radio-captions'

/** One settled caption; its id is stable for list keys. */
export type CaptionLine = {id: number; text: string}

/** The captions on screen: settled lines plus the one still being spoken. */
export type CaptionsState = {
	/** Settled lines, oldest first. */
	lines: CaptionLine[]
	/** The line being spoken now, which the next update replaces. */
	live: string
	nextId: number
}

export const EMPTY_CAPTIONS: CaptionsState = {lines: [], live: '', nextId: 0}

/** How many settled lines are kept, so hours of listening hold a bounded amount of text. */
export const MAX_CAPTION_LINES = 100

type Action = CaptionEvent | {kind: 'clearLive'} | {kind: 'reset'}

/**
 * Applies a caption event. A final replaces the live line, and a blank one
 * still clears it, so a line that settled to nothing does not stay on screen.
 */
export function reduceCaptions(state: CaptionsState, action: Action): CaptionsState {
	switch (action.kind) {
		case 'volatile':
			return {...state, live: action.text}
		case 'final': {
			let text = action.text.trim()
			if (text === '') return {...state, live: ''}
			let lines = [...state.lines, {id: state.nextId, text}].slice(-MAX_CAPTION_LINES)
			return {lines, live: '', nextId: state.nextId + 1}
		}
		case 'clearLive':
			return {...state, live: ''}
		case 'reset':
			return EMPTY_CAPTIONS
		default: {
			let _exhaustive: never = action
			throw new Error(`Unhandled caption action: ${JSON.stringify(_exhaustive)}`)
		}
	}
}
