import {splitWords} from '../captions/caption-rows'
import type {CaptionPresentation} from './store'

/** The words of the live line to draw, and where the dimmed ones start. */
export type PresentedCaption = {words: string[]; dimFrom: number}

/**
 * How the line being spoken shows. `live` draws every word; `hold-back` leaves
 * out its last `heldBackWords` until the line settles; `two-tone` draws all of
 * them with the last ones, from `dimFrom` on, dimmed. Settled lines are not
 * presented: they always show whole.
 */
export function presentCaption(
	text: string,
	{presentation, heldBackWords}: {presentation: CaptionPresentation; heldBackWords: number},
): PresentedCaption {
	let words = splitWords(text)
	switch (presentation) {
		case 'live':
			return {words, dimFrom: words.length}
		case 'hold-back': {
			let kept = words.slice(0, Math.max(0, words.length - heldBackWords))
			return {words: kept, dimFrom: kept.length}
		}
		case 'two-tone':
			return {words, dimFrom: Math.max(0, words.length - heldBackWords)}
		default: {
			let _exhaustive: never = presentation
			throw new Error(`Unhandled caption presentation: ${String(_exhaustive)}`)
		}
	}
}

/** `#RRGGBBAA` with its alpha halved; a colour with no alpha counts as opaque. */
export function dimColor(color: string): string {
	let alpha = color.length >= 9 ? Number.parseInt(color.slice(7, 9), 16) : 255
	let half = Math.round(alpha / 2)
	return `${color.slice(0, 7)}${half.toString(16).toUpperCase().padStart(2, '0')}`
}
