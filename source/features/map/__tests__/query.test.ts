import {describe, expect, test} from '@jest/globals'

import {keys, mapDataOptions} from '../query'

describe('keys', () => {
	test('scopes the cache key by campus', () => {
		expect(keys.all('stolaf')).toEqual(['stolaf', 'map', 'geojson'])
		expect(keys.all('carleton')).toEqual(['carleton', 'map', 'geojson'])
	})

	test('gives the two campuses different keys', () => {
		expect(keys.all('stolaf')).not.toEqual(keys.all('carleton'))
	})
})

describe('mapDataOptions', () => {
	test('keys its query by campus', () => {
		expect(mapDataOptions('stolaf').queryKey).toEqual(keys.all('stolaf'))
		expect(mapDataOptions('carleton').queryKey).toEqual(keys.all('carleton'))
	})

	test('does not share a query key across campuses', () => {
		expect(mapDataOptions('stolaf').queryKey).not.toEqual(mapDataOptions('carleton').queryKey)
	})
})
