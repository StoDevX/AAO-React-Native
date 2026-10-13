import {describe, expect, test} from '@jest/globals'

import {endpointFor, FIXTURE_ENDPOINTS} from '../fixture-endpoints'
import type {CampusRecordingFile} from '../fixtures'
import carleton from '../__fixtures__/edu.carleton'
import stolaf from '../__fixtures__/edu.stolaf'

const recordings: ReadonlyArray<CampusRecordingFile> = [...stolaf, ...carleton]

describe('endpointFor', () => {
	test("matches a campus server's path whatever the campus", () => {
		expect(endpointFor('GET {server:edu.stolaf}/food/named/cafe/stav-hall')?.schema).toBe(
			'food-cafe',
		)
		expect(
			endpointFor('GET {server:example.college}/food/named/cafe/treeline-commons')?.schema,
		).toBe('food-cafe')
	})

	test('matches a WordPress feed on any host', () => {
		expect(
			endpointFor('GET https://echo.college.example/wp-json/wp/v2/posts/12?_fields=content')
				?.schema,
		).toBe('wp-post-content')
	})

	test('a path segment does not match across a slash', () => {
		expect(endpointFor('GET {server:edu.stolaf}/food/named/cafe/a/b')).toBeUndefined()
	})

	test('every recording matches a pattern', () => {
		let unmatched = recordings
			.map((file) => file.key ?? '')
			.filter((key) => endpointFor(key) === undefined)
		expect(unmatched).toEqual([])
	})

	test('every pattern names a distinct schema', () => {
		let schemas = FIXTURE_ENDPOINTS.map((endpoint) => endpoint.schema)
		expect(new Set(schemas).size).toBe(schemas.length)
	})
})
