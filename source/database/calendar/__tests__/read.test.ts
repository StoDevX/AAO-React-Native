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
// `@sentry/react-native` ships ESM-only and Jest's transformIgnorePatterns does
// not let it through, so it is stubbed the same way every other suite here
// stubs it. `read.ts` and `client.ts` report a failed read or a failed drop
// through it.
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

import * as Sentry from '@sentry/react-native'

import type {SqlRunner} from '../../sql'
import {dayWindow, reportingFailures, sponsorMap, sponsorsFor} from '../read'

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

	// America/Chicago springs forward on 2026-03-08 at 2 AM local, so that day
	// is 23 real hours. `dayWindow` builds `today` from local calendar getters
	// (`getFullYear`/`getMonth`/`getDate`) and steps it with `setDate`, which
	// recomputes the equivalent local wall-clock instant rather than adding a
	// fixed number of milliseconds -- so it should floor both sides of the
	// transition to the same day. `toRows`' zero-length guard got this wrong
	// once already, using `date-fns`' `addDays` (a local calendar step short
	// by an hour on this exact day) instead -- see rows.test.ts.
	it('floors to the same window on both sides of a DST spring-forward', () => {
		let before = dayWindow(new Date('2026-03-08T01:30:00-06:00'))
		let after = dayWindow(new Date('2026-03-08T03:30:00-05:00'))
		expect(after).toEqual(before)
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
	// `in ()` is not a SQLite error -- measured against real SQLite, it is a
	// valid, always-false predicate that returns zero rows. So this runner
	// doesn't stand in for a throw SQLite would produce; it fails the test if
	// `sponsorsFor` ever runs a statement for an empty key list, because the
	// answer is already known to be empty and running one would only pay for
	// a prepare and an execute to learn that again.
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
		expect(() => sponsorsFor(explosiveRunner(), [], ['stolaf'])).not.toThrow()
		expect(sponsorsFor(explosiveRunner(), [], ['stolaf'])).toEqual(new Map())
	})

	it('does run the query when there is at least one dedupe key', () => {
		let runner: SqlRunner = {
			exec: () => undefined,
			all: <Row>() => [{dedupe_key: 'dk', orgs: 'Athletics'}] as Row[],
			run: () => undefined,
			transaction: (task) => task(),
		}
		expect(sponsorsFor(runner, ['dk'], ['stolaf'])).toEqual(new Map([['dk', ['Athletics']]]))
	})
})

describe('reportingFailures', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('returns what the read returned, and reports nothing', () => {
		expect(reportingFailures(() => ['a row'])).toEqual(['a row'])
		expect(Sentry.captureException).not.toHaveBeenCalled()
	})

	// Both halves matter, and for different reasons. Reporting is the only way
	// anyone learns a read failed -- a corrupt page, a throw inside
	// `ensureSchema`, a `wire` column `JSON.parse` chokes on. Rethrowing is what
	// marks the query failed, so `useOccurrences` can report `failed` and the
	// screen can offer a retry instead of saying "No events." about a database
	// it could not read.
	it('reports a throw and lets it through', () => {
		let boom = new Error('database disk image is malformed')

		expect(() =>
			reportingFailures(() => {
				throw boom
			}),
		).toThrow(boom)

		expect(Sentry.captureException).toHaveBeenCalledTimes(1)
		expect(Sentry.captureException).toHaveBeenCalledWith(boom)
	})

	it('does not swallow a falsy return value', () => {
		expect(reportingFailures(() => undefined)).toBeUndefined()
		expect(Sentry.captureException).not.toHaveBeenCalled()
	})
})
