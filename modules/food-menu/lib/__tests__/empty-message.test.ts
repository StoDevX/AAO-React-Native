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

	// A cafe can carry a standing message while still serving a full menu. When
	// the reader's own filters are what emptied the meal, that message reads as
	// "this place is closed" and sends them away from a menu that is right there.
	test('blames the filters, not the cafe, when a served meal is filtered empty', () => {
		expect(
			emptyMessage({
				cafeMessage: 'Closed today',
				specialsOnly: false,
				anyFilters: true,
				sectionCount: 0,
				stationCount: 4,
			}),
		).toBe('No items to show. Try changing the filters.')
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
