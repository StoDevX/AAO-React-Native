import {describe, expect, it} from '@jest/globals'
import fixtures from '../../__tests__/fixtures/crossword-playlist-posts.json'
import {crosswordColumnId, parsePuzzle, puzzleIcon, puzzleLabel, puzzleUrl} from '../puzzle'

const html = (id: number) => fixtures.find((p) => p.id === id)?.content.rendered ?? ''

/** A PuzzleMe placeholder as the site's plugin writes it, with the credit line under it. */
const placeholder = (id: string, set: string, type = 'crossword') =>
	`<div style="position: relative;text-align: center">` +
	`<div class="pm-embed-div" data-id="${id}" data-set="${set}" data-puzzletype="${type}" data-height="700px"></div>` +
	`<div class="pm-attribution-div">Constructed using the &lt;a href="https://amuselabs.com/games/crossword/"&gt;cross word builder&lt;/a&gt; from Amuse Labs</div>` +
	`</div>`

describe('parsePuzzle', () => {
	it('reads a bare placeholder, leaving no body', () => {
		expect(parsePuzzle(html(36814))).toStrictEqual({
			puzzle: {
				type: 'crossword',
				id: 'af644d78',
				set: 'c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4',
			},
			blocks: [],
		})
	})

	// The credit line must not reach the page as literal markup.
	it('reads a placeholder wrapped in <p><span>, leaving no body', () => {
		expect(parsePuzzle(html(36760))).toStrictEqual({
			puzzle: {
				type: 'crossword',
				id: '82ffbf79',
				set: 'fa9264f35d69ab1bbd7b3eec35507484925baa57163cfbbc9a7964a87ac40e41',
			},
			blocks: [],
		})
	})

	// Hand-written: every Crossword post so far is only the puzzle.
	it('keeps any other text in the body', () => {
		let found = parsePuzzle(
			`<p>Theme: the sky at the ends of the day.</p>${placeholder('a1', 'b2')}`,
		)
		expect(found?.blocks).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'Theme: the sky at the ends of the day.'}]},
		])
	})

	// Hand-written: all 13 Crossword posts on 2026-09-26 carry a placeholder.
	it('gives nothing for a post without a placeholder', () => {
		expect(parsePuzzle('<p>No puzzle this week.</p>')).toBeNull()
	})

	it('gives nothing for a placeholder with an empty id or set', () => {
		expect(parsePuzzle(placeholder('', 'b2'))).toBeNull()
		expect(parsePuzzle(placeholder('a1', ' '))).toBeNull()
	})

	// The Puzzle column's "Guess the hidden word" (37114), as olafmessenger.com served it on 2026-10-03.
	it('reads a PuzzleMe placeholder of another kind, such as a word game', () => {
		let wordrow =
			`<p><span style="font-weight: 400;"><div style="position: relative;text-align: center">` +
			`<div class="pm-embed-div" data-id="9d6dbf85" data-set="1977" data-puzzletype="wordrow" data-height="700px" data-mobilemargin="10px" data-embedparams="embed=wp"></div>` +
			`<div class="pm-attribution-div" style="font-family: sans-serif;font-size: 12px;color:#666666;padding-top: 5px;width: 100%">Constructed with the &lt;a href="https://amuselabs.com/games/wordrow/" target="_blank" style="color: #666666; text-decoration: underline;"&gt;custom wordle generator&lt;/a&gt; from Amuse Labs</div>` +
			`</div></span></p>`

		expect(parsePuzzle(wordrow)).toStrictEqual({
			puzzle: {type: 'wordrow', id: '9d6dbf85', set: '1977'},
			blocks: [],
		})
	})

	it('gives nothing for a placeholder that names no kind of puzzle', () => {
		expect(parsePuzzle(placeholder('a1', 'b2', ' '))).toBeNull()
	})
})

const POST = 'https://olafmessenger.com/37114/variety/puzzle/guess-the-hidden-word/'

describe('puzzleUrl', () => {
	it("builds the address of PuzzleMe's player for the puzzle's kind", () => {
		expect(
			puzzleUrl(
				{
					type: 'crossword',
					id: 'af644d78',
					set: 'c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4',
				},
				POST,
			),
		).toBe(
			'https://puzzleme.amuselabs.com/pmm/crossword?id=af644d78&set=c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4&embed=1',
		)
	})

	it("builds a word game's address", () => {
		expect(puzzleUrl({type: 'wordrow', id: '9d6dbf85', set: '1977'}, POST)).toBe(
			'https://puzzleme.amuselabs.com/pmm/wordrow?id=9d6dbf85&set=1977&embed=1',
		)
	})

	it('encodes the id and set', () => {
		expect(puzzleUrl({type: 'crossword', id: 'a b', set: 'x&y=z'}, POST)).toBe(
			'https://puzzleme.amuselabs.com/pmm/crossword?id=a%20b&set=x%26y%3Dz&embed=1',
		)
	})

	// Amuse Labs adds games; one whose player we have not found opens where the site's script draws it.
	it("opens the post's own page for a kind of puzzle with no known player", () => {
		expect(puzzleUrl({type: 'spiral', id: 'a1', set: 'b2'}, POST)).toBe(POST)
	})
})

describe('puzzleIcon', () => {
	it('draws a crossword as its grid', () => {
		expect(puzzleIcon({type: 'crossword', id: 'a1', set: 'b2'})).toBe('square.grid.3x3')
	})

	it('draws any other kind as a puzzle piece', () => {
		expect(puzzleIcon({type: 'wordrow', id: 'a1', set: 'b2'})).toBe('puzzlepiece')
	})
})

describe('puzzleLabel', () => {
	it('names a crossword', () => {
		expect(puzzleLabel({type: 'crossword', id: 'a1', set: 'b2'})).toBe('Solve the crossword')
	})

	it('names any other kind as a puzzle', () => {
		expect(puzzleLabel({type: 'wordrow', id: 'a1', set: 'b2'})).toBe('Solve the puzzle')
	})
})

describe('crosswordColumnId', () => {
	it('finds the crossword column by name', () => {
		let categories = [
			{id: 24, name: 'Comic', parent: 7},
			{id: 1059, name: 'Crossword', parent: 7},
		]

		expect(crosswordColumnId(categories)).toBe(1059)
	})

	it('finds nothing when the paper has no crossword column', () => {
		expect(crosswordColumnId([{id: 24, name: 'Comic', parent: 7}])).toBeUndefined()
	})
})
