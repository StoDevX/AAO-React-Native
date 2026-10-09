import {describe, expect, test} from '@jest/globals'

import {sourceRankOf} from '../query'
import {REMOTE_SOURCES, remoteSourcesFor} from '../sources'

// Jest's setup reports UI-test mode, which swaps every calendar for the fixture;
// the campus lists are the live ones.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

describe('remoteSourcesFor', () => {
	test('offers the calendars a campus names, in dedupe order', () => {
		expect(remoteSourcesFor(['presence', 'stolaf']).map((source) => source.id)).toEqual([
			'stolaf',
			'presence',
		])
	})

	test("offers Carleton's calendar alone when it is named alone", () => {
		expect(remoteSourcesFor(['carleton']).map((source) => source.id)).toEqual(['carleton'])
	})

	test('offers nothing to a campus naming no calendars', () => {
		expect(remoteSourcesFor([])).toEqual([])
	})

	test('skips an id naming no calendar', () => {
		expect(remoteSourcesFor(['northfield']).map((source) => source.id)).toEqual([])
	})

	test('ranks each campus by the one list of every calendar', () => {
		expect(REMOTE_SOURCES.map((source) => source.id)).toEqual(['stolaf', 'presence', 'carleton'])
		expect(sourceRankOf('carleton')).toBe(2)
	})
})
