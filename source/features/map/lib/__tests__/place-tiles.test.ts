import {placeTiles, splitCarousel} from '../place-tiles'

describe('placeTiles', () => {
	it('puts departments before offices, from either campus shape', () => {
		expect(
			placeTiles({
				departments: [{label: 'Biology', href: 'https://wp.stolaf.edu/biology/'}],
				offices: ['Alumni Relations <https://apps.carleton.edu/alumni/relations/>'],
			}),
		).toEqual([
			{kind: 'department', label: 'Biology', href: 'https://wp.stolaf.edu/biology/'},
			{
				kind: 'office',
				label: 'Alumni Relations',
				href: 'https://apps.carleton.edu/alumni/relations/',
			},
		])
	})

	it('keeps a tile with no link, without one', () => {
		expect(placeTiles({departments: ['Chemistry'], offices: []})).toEqual([
			{kind: 'department', label: 'Chemistry', href: null},
		])
	})

	// The feed is not validated at the boundary, so a record can omit either
	// field entirely.
	it('copes with fields the feed left out', () => {
		expect(placeTiles({departments: undefined, offices: undefined} as never)).toEqual([])
	})
})

describe('splitCarousel', () => {
	let tiles = (count: number) => Array.from({length: count}, (_, i) => i)

	it('shows every tile up to seven', () => {
		expect(splitCarousel(tiles(6))).toEqual({shown: tiles(6), hidden: []})
		// A More tile would take the seventh tile's place to hide just that one.
		expect(splitCarousel(tiles(7))).toEqual({shown: tiles(7), hidden: []})
	})

	it('shows six and hides the rest past seven', () => {
		expect(splitCarousel(tiles(8))).toEqual({shown: tiles(6), hidden: [6, 7]})
	})
})
