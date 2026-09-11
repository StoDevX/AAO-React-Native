import {EXAMPLE_SEPARATOR} from './metrics'
import {withoutFullStop} from './full-stop'
import type {Sense} from '../types'

/** The runs a sense is set from, in the order a dictionary reads them. */
export type SenseText = {
	/** Bracketed and italic, where the sense has one. */
	grammar?: string
	definition: string
	/** Run on from the definition after a colon, where the sense has any. */
	citations?: string
}

/**
 * Sets one sense as a dictionary does: an optional bracketed grammar label,
 * the definition, then any citations run on after a colon.
 */
export function senseText(sense: Sense): SenseText {
	let citations = sense.examples?.length ? `: ${sense.examples.join(EXAMPLE_SEPARATOR)}` : undefined

	return {
		...(sense.grammar ? {grammar: `[${sense.grammar}] `} : {}),
		definition: citations ? withoutFullStop(sense.definition) : sense.definition,
		...(citations ? {citations} : {}),
	}
}

/**
 * The phonetics as a dictionary sets them, between bars. Undefined for an
 * entry with none, which is most of them -- the line is withheld rather than
 * drawn empty.
 */
export function pronunciationText(pronunciation: string | undefined): string | undefined {
	return pronunciation ? `| ${pronunciation} |` : undefined
}
