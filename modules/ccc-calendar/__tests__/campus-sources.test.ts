import {describe, expect, test} from '@jest/globals'

import {sourceRankOf} from '../query'
import {REMOTE_SOURCES, remoteSourcesFor} from '../sources'

// Jest's setup reports UI-test mode, which swaps every calendar for the fixture;
// the campus lists are the live ones.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

describe('remoteSourcesFor', () => {
	test("offers St. Olaf's own calendar and Presence on St. Olaf", () => {
		expect(remoteSourcesFor('stolaf').map((source) => source.id)).toEqual(['stolaf', 'presence'])
	})

	test("offers Carleton's calendar alone on Carleton", () => {
		expect(remoteSourcesFor('carleton').map((source) => source.id)).toEqual(['carleton'])
	})

	test('ranks each campus by the one list of every calendar', () => {
		expect(REMOTE_SOURCES.map((source) => source.id)).toEqual(['stolaf', 'presence', 'carleton'])
		expect(sourceRankOf('carleton')).toBe(2)
	})
})
