import {describe, expect, it} from '@jest/globals'
import fixtures from '../../__tests__/fixtures/crossword-playlist-posts.json'
import {crosswordUrl, parseCrossword} from '../crossword'

const html = (id: number) => fixtures.find((p) => p.id === id)?.content.rendered ?? ''

/** A PuzzleMe placeholder as the site's plugin writes it, with the credit line under it. */
const placeholder = (id: string, set: string, type = 'crossword') =>
	`<div style="position: relative;text-align: center">` +
	`<div class="pm-embed-div" data-id="${id}" data-set="${set}" data-puzzletype="${type}" data-height="700px"></div>` +
	`<div class="pm-attribution-div">Constructed using the &lt;a href="https://amuselabs.com/games/crossword/"&gt;cross word builder&lt;/a&gt; from Amuse Labs</div>` +
	`</div>`

describe('parseCrossword', () => {
	it('reads a bare placeholder, leaving no body', () => {
		expect(parseCrossword(html(36814))).toStrictEqual({
			puzzle: {
				id: 'af644d78',
				set: 'c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4',
			},
			blocks: [],
		})
	})

	// The credit line must not reach the page as literal markup.
	it('reads a placeholder wrapped in <p><span>, leaving no body', () => {
		expect(parseCrossword(html(36760))).toStrictEqual({
			puzzle: {
				id: '82ffbf79',
				set: 'fa9264f35d69ab1bbd7b3eec35507484925baa57163cfbbc9a7964a87ac40e41',
			},
			blocks: [],
		})
	})

	// Hand-written: every Crossword post so far is only the puzzle.
	it('keeps any other text in the body', () => {
		let found = parseCrossword(
			`<p>Theme: the sky at the ends of the day.</p>${placeholder('a1', 'b2')}`,
		)
		expect(found?.blocks).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'Theme: the sky at the ends of the day.'}]},
		])
	})

	// Hand-written: all 13 Crossword posts on 2026-09-26 carry a placeholder.
	it('gives nothing for a post without a placeholder', () => {
		expect(parseCrossword('<p>No puzzle this week.</p>')).toBeNull()
	})

	it('gives nothing for a placeholder with an empty id or set', () => {
		expect(parseCrossword(placeholder('', 'b2'))).toBeNull()
		expect(parseCrossword(placeholder('a1', ' '))).toBeNull()
	})

	it('gives nothing for a PuzzleMe placeholder that is not a crossword', () => {
		expect(parseCrossword(placeholder('a1', 'b2', 'wordsearch'))).toBeNull()
	})
})

describe('crosswordUrl', () => {
	it('builds the PuzzleMe player address', () => {
		expect(
			crosswordUrl({
				id: 'af644d78',
				set: 'c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4',
			}),
		).toBe(
			'https://puzzleme.amuselabs.com/pmm/crossword?id=af644d78&set=c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4&embed=1',
		)
	})

	it('encodes the id and set', () => {
		expect(crosswordUrl({id: 'a b', set: 'x&y=z'})).toBe(
			'https://puzzleme.amuselabs.com/pmm/crossword?id=a%20b&set=x%26y%3Dz&embed=1',
		)
	})
})
