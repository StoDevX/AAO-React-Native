// `read.ts` is imported here for its query-key head alone, but reaching it runs
// `client.ts`'s top-level `import * as SQLite from 'expo-sqlite'` -- a native
// module with nothing to bind to under Jest. Mocked for that reason only, the
// same way `source/database/calendar/__tests__/read.test.ts` does it.
jest.mock('expo-sqlite', () => ({
	openDatabaseSync: jest.fn(),
	deleteDatabaseSync: jest.fn(),
}))
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)
// `@sentry/react-native` ships ESM-only and Jest's transformIgnorePatterns does
// not let it through, so it is stubbed the same way every other suite here
// stubs it. `read.ts` and `client.ts` report a failed read or a failed drop
// through it.
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

import type {Query} from '@tanstack/react-query'

import {CALENDAR_READ_KEY} from '../../database/calendar/read'
import {persistOptions} from '../tanstack-query'

const WINDOW = {fromUtc: 0, toUtc: 1, fromDate: '2026-08-16', toDate: '2027-03-14'}

/**
 * Every calendar query key the app builds today, plus the two that stand for
 * the ones it does not build yet.
 *
 * The three read keys are spelled out rather than imported as builders so a
 * head that drifted from `CALENDAR_READ_KEY` would still be listed here and
 * still be checked. `CALENDAR_READ_KEY` itself covers the read hook somebody
 * adds next, and `'calendar-anything-else'` covers a head nobody thought to
 * add to the filter at all: all three read hooks shipped under `'calendar-db'`
 * while the filter still compared against `'calendar'` exactly, which
 * dehydrated `SourcedEvent[]` -- `Moment`s that `JSON.parse` restores as
 * strings -- into AsyncStorage and crashed the next cold launch.
 */
const CALENDAR_KEYS: [string, readonly unknown[]][] = [
	['useOccurrences', ['calendar-db', 'occurrences', 0, WINDOW, ['stolaf'], []]],
	['useFacets', ['calendar-db', 'facets', 0, 'category', WINDOW, ['stolaf']]],
	['useEvent', ['calendar-db', 'event', 0, 'stolaf', '2026-09-20T18:00:00.000Z|Soccer']],
	['a read hook not yet written', [CALENDAR_READ_KEY, 'something-new']],
	// The ingest receipt, from `modules/ccc-calendar/query.ts`. Spelled out
	// rather than imported: reaching that module drags in EventKit and the
	// shared query client for a three-element literal.
	['the namedCalendarOptions receipt', ['calendar', 'named', 'stolaf']],
	['a calendar key not yet written', ['calendar-anything-else', 'whatever']],
]

/** A successful query carrying `queryKey` -- the only state the filter reads. */
function successful(queryKey: readonly unknown[]): Query {
	return {queryKey, state: {status: 'success'}} as unknown as Query
}

function shouldDehydrate(queryKey: readonly unknown[]): boolean {
	return persistOptions.dehydrateOptions.shouldDehydrateQuery(successful(queryKey))
}

describe('shouldDehydrateQuery', () => {
	test.each(CALENDAR_KEYS)('keeps the %s key out of AsyncStorage', (_name, queryKey) => {
		expect(shouldDehydrate(queryKey)).toBe(false)
	})

	test('still persists a broadcast schedule, whose events are not in the database', () => {
		expect(shouldDehydrate(['schedule', 'ksto'])).toBe(true)
	})

	test('still persists every other feature', () => {
		expect(shouldDehydrate(['news', 'stolaf'])).toBe(true)
		expect(shouldDehydrate(['dining', 'menu'])).toBe(true)
	})

	// Composed with the default rather than replacing it, which is what keeps
	// failed and pending queries for every other feature out of AsyncStorage.
	test('still refuses a query that has not succeeded', () => {
		let pending = {queryKey: ['news'], state: {status: 'pending'}} as unknown as Query
		expect(persistOptions.dehydrateOptions.shouldDehydrateQuery(pending)).toBe(false)
	})
})
