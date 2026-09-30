import {describe, expect, test} from '@jest/globals'

import {makeBuilding} from '../../__tests__/fixtures'
import {
	RECENT_PLACES_LIMIT,
	recentPlaces,
	withoutRecentPlace,
	withRecentPlace,
} from '../recent-places'

describe('withRecentPlace', () => {
	test('puts the place just opened first', () => {
		expect(withRecentPlace(['a', 'b'], 'c')).toEqual(['c', 'a', 'b'])
	})

	test('moves a place opened again to the top rather than listing it twice', () => {
		expect(withRecentPlace(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c'])
	})

	test('keeps only the most recent ten', () => {
		let full = Array.from({length: RECENT_PLACES_LIMIT}, (_, i) => `p${i}`)
		let next = withRecentPlace(full, 'new')
		expect(next).toHaveLength(RECENT_PLACES_LIMIT)
		expect(next[0]).toBe('new')
		expect(next).not.toContain(`p${RECENT_PLACES_LIMIT - 1}`)
	})
})

describe('recentPlaces', () => {
	let places = [makeBuilding({id: 'a', name: 'Alpha'}), makeBuilding({id: 'b', name: 'Beta'})]

	test('the remembered places, in the order they were opened', () => {
		expect(recentPlaces(['b', 'a'], places).map((place) => place.id)).toEqual(['b', 'a'])
	})

	// A place the feed has since dropped has no row to open.
	test('skips a place the map no longer has', () => {
		expect(recentPlaces(['gone', 'a'], places).map((place) => place.id)).toEqual(['a'])
	})
})

describe('withoutRecentPlace', () => {
	test('drops one place and keeps the others in order', () => {
		expect(withoutRecentPlace(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
	})
})
