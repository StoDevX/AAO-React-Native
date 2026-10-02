import {cssSelect, parseHtml, removeElement, type AnyNode, type Element} from '@frogpond/html-lib'
import type {Block, CrosswordPuzzle} from '../types'
import {blocksFromNodes} from './blocks'

/** The placeholder PuzzleMe's WordPress plugin writes, which its script turns into the player. */
const PLACEHOLDER = '.pm-embed-div[data-puzzletype="crossword"]'
/** The placeholder and the credit line under it: neither is text a reader should see. */
const PUZZLEME_PARTS = '.pm-embed-div, .pm-attribution-div'

/**
 * A Crossword post's puzzle, from the first PuzzleMe crossword placeholder in its raw HTML,
 * and the body left once PuzzleMe's own parts are taken out. Null when there is no
 * placeholder, or it names no puzzle.
 */
export function parseCrossword(html: string): {puzzle: CrosswordPuzzle; blocks: Block[]} | null {
	let document = parseHtml(html)
	let placeholder = cssSelect<AnyNode, Element>(PLACEHOLDER, document)[0]
	let id = placeholder?.attribs['data-id']?.trim() ?? ''
	let set = placeholder?.attribs['data-set']?.trim() ?? ''
	if (id === '' || set === '') return null
	for (let part of cssSelect<AnyNode, Element>(PUZZLEME_PARTS, document)) removeElement(part)
	return {puzzle: {id, set}, blocks: blocksFromNodes(document.children)}
}

/** The address of PuzzleMe's player for a puzzle, which works on a phone without the site's script. */
export function crosswordUrl(puzzle: CrosswordPuzzle): string {
	let id = encodeURIComponent(puzzle.id)
	let set = encodeURIComponent(puzzle.set)
	return `https://puzzleme.amuselabs.com/pmm/crossword?id=${id}&set=${set}&embed=1`
}
