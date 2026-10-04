import {sportsFilter, SPORTS_FILTER_KEY} from '../sports-filter'
import type {ProcessedScore} from '../types'

const game = (sport: string): ProcessedScore => ({id: sport, sport}) as ProcessedScore

const scores = [game('Volleyball'), game("Men's Golf"), game("Women's Soccer"), game("Men's Golf")]

describe('sportsFilter', () => {
	it("offers each sport once, Women's first, then Men's, then the rest", () => {
		let filter = sportsFilter(scores, [])

		expect(filter.spec.options.map((o) => o.title)).toEqual([
			"Women's Soccer",
			"Men's Golf",
			'Volleyball',
		])
	})

	it('is off, with nothing selected, while the selection is empty', () => {
		let filter = sportsFilter(scores, [])

		expect(filter.enabled).toBe(false)
		expect(filter.spec.selected).toEqual([])
	})

	it('selects the chosen sports and turns on', () => {
		let filter = sportsFilter(scores, ['Volleyball'])

		expect(filter.enabled).toBe(true)
		expect(filter.spec.selected.map((o) => o.title)).toEqual(['Volleyball'])
	})

	it('is keyed for the UI tests', () => {
		expect(sportsFilter(scores, []).key).toBe(SPORTS_FILTER_KEY)
	})
})
