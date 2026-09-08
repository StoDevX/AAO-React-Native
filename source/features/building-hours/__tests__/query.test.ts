import {describe, expect, jest, test} from '@jest/globals'

// query.ts pulls in the redux barrel for useGroupedBuildings' favorites
// selector. That barrel eagerly configures the store, which wires up the
// Sentry enhancer -- and Sentry's React Native SDK reaches for the native
// fetch module on import, which doesn't exist under Jest. None of that is
// exercised by the tests below, so stub it out rather than pull in a real
// store.
jest.mock('../../../redux', () => ({
	selectFavoriteBuildings: jest.fn(),
	useAppSelector: jest.fn(),
}))

import {buildingByNameOptions, buildingsOptions, keys} from '../query'

describe('keys', () => {
	test('scopes the cache key by campus', () => {
		expect(keys.all('stolaf')).toEqual(['stolaf', 'buildings'])
		expect(keys.all('carleton')).toEqual(['carleton', 'buildings'])
	})

	test('gives the two campuses different keys', () => {
		expect(keys.all('stolaf')).not.toEqual(keys.all('carleton'))
	})
})

describe('buildingByNameOptions', () => {
	test('shares its query key with buildingsOptions for the same campus, so the detail sheet reads a warm cache', () => {
		expect(buildingByNameOptions('stolaf', 'Rølvaag Library').queryKey).toEqual(
			buildingsOptions('stolaf').queryKey,
		)
		expect(buildingByNameOptions('carleton', 'The Libe').queryKey).toEqual(
			buildingsOptions('carleton').queryKey,
		)
	})

	test('does not share a query key across campuses', () => {
		expect(buildingByNameOptions('stolaf', 'Rølvaag Library').queryKey).not.toEqual(
			buildingByNameOptions('carleton', 'Rølvaag Library').queryKey,
		)
	})
})
