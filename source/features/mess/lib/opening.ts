import type {Run} from '../types'

/** How many words of a story's first paragraph are set in small caps. */
const OPENING_WORDS = 4

/** Up to the first four words, stopping short of a line break. */
const OPENING = new RegExp(`^(?:[^\\s]+[^\\S\\n]+){0,${OPENING_WORDS - 1}}[^\\s]+`, 'u')

/**
 * A first paragraph's opening words, set apart to be drawn in small caps, and
 * the runs that follow them. The opening is taken only from a plain first
 * run: small caps are drawn as plain text, so a bold, italic or linked opening
 * would lose its style, and is left as it was.
 */
export function splitOpening(runs: Run[]): {opening: string; rest: Run[]} {
	let [first, ...others] = runs
	if (!first || first.bold || first.italic || first.href) return {opening: '', rest: runs}

	let opening = OPENING.exec(first.text)?.[0] ?? ''
	if (opening === '') return {opening: '', rest: runs}

	let remainder = first.text.slice(opening.length)
	return {opening, rest: remainder === '' ? others : [{text: remainder}, ...others]}
}
