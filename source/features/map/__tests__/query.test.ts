import {describe, expect, test} from '@jest/globals'

import {UITEST_MAPS} from '../__fixtures__/maps'
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

	// Jest runs as a UI test, so this is the path the XCUITests take.
	test.each(['stolaf', 'carleton'] as const)(
		"serves %s's map from the fixture under UI tests",
		async (campus) => {
			let {queryFn} = mapDataOptions(campus)
			let context = {signal: new AbortController().signal} as Parameters<
				NonNullable<typeof queryFn>
			>[0]

			await expect(queryFn?.(context)).resolves.toBe(UITEST_MAPS[campus].features)
		},
	)
})
