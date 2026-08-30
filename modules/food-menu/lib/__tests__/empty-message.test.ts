import {describe, expect, test} from '@jest/globals'
import {emptyMessage} from '../empty-message'

describe('emptyMessage', () => {
	test("prefers the cafe's own message", () => {
		expect(
			emptyMessage({
				cafeMessage: 'Closed for Christmas',
				specialsOnly: true,
				anyFilters: true,
				sectionCount: 0,
				stationCount: 0,
			}),
		).toBe('Closed for Christmas')
	})

	test('explains an empty specials filter', () => {
		expect(
			emptyMessage({
				cafeMessage: null,
				specialsOnly: true,
				anyFilters: true,
				sectionCount: 0,
				stationCount: 0,
			}),
		).toBe('No items to show. There may be no specials today. Try changing the filters.')
	})

	test('blames the filters when they are on and nothing survived', () => {
		expect(
			emptyMessage({
				cafeMessage: null,
				specialsOnly: false,
				anyFilters: true,
				sectionCount: 0,
				stationCount: 3,
			}),
		).toBe('No items to show. Try changing the filters.')
	})

	test('falls back to the plain message', () => {
		expect(
			emptyMessage({
				cafeMessage: null,
				specialsOnly: false,
				anyFilters: false,
				sectionCount: 0,
				stationCount: 3,
			}),
		).toBe('No items to show.')
	})
})
