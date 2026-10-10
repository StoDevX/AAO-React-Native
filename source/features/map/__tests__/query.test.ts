import {describe, expect, test} from '@jest/globals'

import {keys, mapDataOptions} from '../query'

describe('keys', () => {
	test('scopes the cache key by campus', () => {
		expect(keys.all('edu.stolaf')).toEqual(['edu.stolaf', 'map', 'geojson'])
		expect(keys.all('edu.carleton')).toEqual(['edu.carleton', 'map', 'geojson'])
	})

	test('gives the two campuses different keys', () => {
		expect(keys.all('edu.stolaf')).not.toEqual(keys.all('edu.carleton'))
	})
})

describe('mapDataOptions', () => {
	test('keys its query by campus', () => {
		expect(mapDataOptions('edu.stolaf').queryKey).toEqual(keys.all('edu.stolaf'))
		expect(mapDataOptions('edu.carleton').queryKey).toEqual(keys.all('edu.carleton'))
	})

	test('does not share a query key across campuses', () => {
		expect(mapDataOptions('edu.stolaf').queryKey).not.toEqual(
			mapDataOptions('edu.carleton').queryKey,
		)
	})
})
