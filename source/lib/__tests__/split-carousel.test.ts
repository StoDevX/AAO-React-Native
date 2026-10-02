import {splitCarousel} from '../split-carousel'

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
