import {describe, expect, it} from '@jest/globals'
import type {MessStory} from '../../types'
import {rowGlyph} from '../row-glyph'

const STORY: MessStory = {
	id: 1,
	title: 'A story',
	excerpt: '',
	link: 'https://olafmessenger.com/1/',
	published: '2026-04-29T22:00:00.000Z',
	section: 'Variety',
	column: null,
	featured: false,
	bylines: [],
	photo: null,
	blocks: [],
	layout: {kind: 'article'},
}

describe('rowGlyph', () => {
	it('draws a puzzle by its kind', () => {
		let puzzle = {type: 'crossword', id: 'a1', set: 'b2'}
		expect(rowGlyph({...STORY, column: 'Crossword', layout: {kind: 'puzzle', puzzle}})).toBe(
			'square.grid.3x3',
		)
	})

	it.each([
		['Playlist', 'music.note.list'],
		['Short Story', 'book.pages'],
		['Poetry', 'quote.opening'],
		['Horoscopes', 'moon.stars'],
	])('draws a %s story as %s', (column, glyph) => {
		expect(rowGlyph({...STORY, column})).toBe(glyph)
	})

	it('draws nothing for a column with no glyph of its own', () => {
		expect(rowGlyph({...STORY, column: 'Good Questions'})).toBeNull()
		expect(rowGlyph(STORY)).toBeNull()
	})
})
