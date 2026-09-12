// `read.ts` also exports hooks that call `getRunner()`, which imports
// `expo-sqlite` -- a native module with nothing to bind to under Jest.
// `dayWindow` never touches it, but importing the module to reach `dayWindow`
// still runs `client.ts`'s top-level `import * as SQLite from 'expo-sqlite'`,
// which crashes before any test body runs. Mocked here for that reason alone,
// same as `expo-router` and `@expo/ui` are mocked in the dictionary screen
// tests -- this stands in for a native binding, not for logic under test.
jest.mock('expo-sqlite', () => ({
	openDatabaseSync: jest.fn(),
	deleteDatabaseSync: jest.fn(),
}))

import type {SqlRunner} from '../../sql'
import {dayWindow, sponsorMap, sponsorsFor} from '../read'

describe('dayWindow', () => {
	it('is stable across a day, so a minute ticker cannot change the query key', () => {
		let morning = dayWindow(new Date('2026-09-15T08:00:00-05:00'))
		let evening = dayWindow(new Date('2026-09-15T22:00:00-05:00'))
		expect(evening).toEqual(morning)
	})

	it('reaches 30 days back and 180 forward', () => {
		let window = dayWindow(new Date('2026-09-15T12:00:00-05:00'))
		expect(window.fromDate).toBe('2026-08-16')
		expect(window.toDate).toBe('2027-03-14')
	})

	it('changes when the day does', () => {
		let before = dayWindow(new Date('2026-09-15T23:59:00-05:00'))
		let after = dayWindow(new Date('2026-09-16T00:01:00-05:00'))
		expect(after).not.toEqual(before)
	})
})

describe('sponsorMap', () => {
	it('splits the delimited orgs column back into the array hydrate expects', () => {
		let map = sponsorMap([{dedupe_key: 'dk', orgs: `Music Dept\x1FStudent Activities`}])
		expect(map.get('dk')).toEqual(['Music Dept', 'Student Activities'])
	})

	it('keeps a single sponsor as a one-element array, not a bare string', () => {
		let map = sponsorMap([{dedupe_key: 'dk', orgs: 'Athletics'}])
		expect(map.get('dk')).toEqual(['Athletics'])
	})

	it('keys by every row, for more than one event', () => {
		let map = sponsorMap([
			{dedupe_key: 'dk-a', orgs: 'Athletics'},
			{dedupe_key: 'dk-b', orgs: 'Music Dept'},
		])
		expect(map.get('dk-a')).toEqual(['Athletics'])
		expect(map.get('dk-b')).toEqual(['Music Dept'])
	})
})

describe('sponsorsFor', () => {
	// A runner that fails the test if it is ever asked to run a statement --
	// standing in for what a real `in ()` would do: throw a SQLite syntax
	// error. Reaching it at all is the failure this guard exists to prevent.
	function explosiveRunner(): SqlRunner {
		return {
			exec: () => {
				throw new Error('sponsorsFor must not touch the runner for an empty key list')
			},
			all: () => {
				throw new Error('sponsorsFor must not touch the runner for an empty key list')
			},
			run: () => {
				throw new Error('sponsorsFor must not touch the runner for an empty key list')
			},
			transaction: () => {
				throw new Error('sponsorsFor must not touch the runner for an empty key list')
			},
		}
	}

	it('returns an empty map without running a query when there are no dedupe keys', () => {
		expect(() => sponsorsFor(explosiveRunner(), [])).not.toThrow()
		expect(sponsorsFor(explosiveRunner(), [])).toEqual(new Map())
	})

	it('does run the query when there is at least one dedupe key', () => {
		let runner: SqlRunner = {
			exec: () => undefined,
			all: <Row>() => [{dedupe_key: 'dk', orgs: 'Athletics'}] as Row[],
			run: () => undefined,
			transaction: (task) => task(),
		}
		expect(sponsorsFor(runner, ['dk'])).toEqual(new Map([['dk', ['Athletics']]]))
	})
})
