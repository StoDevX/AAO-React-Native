import type {SFSymbol} from 'sf-symbols-typescript'
import {cssSelect, parseHtml, removeElement, type AnyNode, type Element} from '@frogpond/html-lib'
import type {Block, MessCategory, Puzzle} from '../types'
import {blocksFromNodes} from './blocks'

/**
 * The placeholder PuzzleMe's WordPress plugin writes, which its script turns into the player. Its
 * `data-puzzletype` names the game -- a crossword, a word game, a sudoku -- and the player's address.
 */
const PLACEHOLDER = '.pm-embed-div[data-puzzletype]'
/** The placeholder and the credit line under it: neither is text a reader should see. */
const PUZZLEME_PARTS = '.pm-embed-div, .pm-attribution-div'

/**
 * A post's puzzle, from the first PuzzleMe placeholder in its raw HTML, and the body left once
 * PuzzleMe's own parts are taken out. Null when there is no placeholder, or it names no puzzle.
 */
export function parsePuzzle(html: string): {puzzle: Puzzle; blocks: Block[]} | null {
	let document = parseHtml(html)
	let placeholder = cssSelect<AnyNode, Element>(PLACEHOLDER, document)[0]
	let type = placeholder?.attribs['data-puzzletype']?.trim() ?? ''
	let id = placeholder?.attribs['data-id']?.trim() ?? ''
	let set = placeholder?.attribs['data-set']?.trim() ?? ''
	if (type === '' || id === '' || set === '') return null
	for (let part of cssSelect<AnyNode, Element>(PUZZLEME_PARTS, document)) removeElement(part)
	return {puzzle: {type, id, set}, blocks: blocksFromNodes(document.children)}
}

/**
 * The PuzzleMe games whose player answers at `/pmm/` and the placeholder's type, checked on
 * 2026-10-03. Others on amuselabs.com/games, such as Spiral and Marching Bands, did not.
 */
const PLAYER_TYPES = new Set([
	'codeword',
	'crossword',
	'jigsaw',
	'krisskross',
	'quiz',
	'slide',
	'sudoku',
	'wordrow',
	'wordsearch',
])

/**
 * Where a puzzle is played: PuzzleMe's own player, which works on a phone without the site's
 * script, or for a game with no known player the post's page at `postUrl`, where that script
 * draws it.
 */
export function puzzleUrl(puzzle: Puzzle, postUrl: string): string {
	if (!PLAYER_TYPES.has(puzzle.type)) return postUrl
	let id = encodeURIComponent(puzzle.id)
	let set = encodeURIComponent(puzzle.set)
	return `https://puzzleme.amuselabs.com/pmm/${puzzle.type}?id=${id}&set=${set}&embed=1`
}

/** The glyph for a puzzle's kind: a crossword's grid, or a puzzle piece for any other game. */
export function puzzleIcon(puzzle: Puzzle): SFSymbol {
	return puzzle.type === 'crossword' ? 'square.grid.3x3' : 'puzzlepiece'
}

/** What the button that opens a puzzle says. */
export function puzzleLabel(puzzle: Puzzle): string {
	return puzzle.type === 'crossword' ? 'Solve the crossword' : 'Solve the puzzle'
}

/** The Variety column whose posts are the paper's crosswords. */
export const CROSSWORD_COLUMN = 'Crossword'

/** The id WordPress gave the crossword column, which the paper's feed does not promise to keep. */
export function crosswordColumnId(categories: MessCategory[]): number | undefined {
	return categories.find((category) => category.name === CROSSWORD_COLUMN)?.id
}
