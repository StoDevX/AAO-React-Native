// `read.ts` is imported here for its query-key head alone, but reaching it runs
// `client.ts`'s top-level `import * as SQLite from 'expo-sqlite'` -- a native
// module with nothing to bind to under Jest. Mocked for that reason only, the
// same way `source/database/calendar/__tests__/read.test.ts` does it.
jest.mock('expo-sqlite', () => ({
	openDatabaseSync: jest.fn(),
	deleteDatabaseSync: jest.fn(),
}))
// `read.ts` and `client.ts` report a failed read or a failed drop through
// `@sentry/react-native`, stubbed so a report goes nowhere.
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

import {dehydrate, QueryClient, type Query} from '@tanstack/react-query'
import {
	persistQueryClientRestore,
	type PersistedClient,
	type Persister,
} from '@tanstack/react-query-persist-client'

import {CALENDAR_READ_KEY} from '../../database/calendar/read'
import {persistOptions, serializeCache} from '../tanstack-query'

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
	['useOccurrences', ['calendar-db', 'occurrences', 0, WINDOW, ['stolaf'], [], []]],
	['useFacets', ['calendar-db', 'facets', 0, 'category', WINDOW, ['stolaf'], []]],
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

describe('a query that sets how it persists, in its meta', () => {
	/** A query as the persister is handed it, with the meta it was made with. */
	const cached = (queryKey: readonly unknown[], state: object, meta?: object) => ({
		queryKey,
		queryHash: JSON.stringify(queryKey),
		state,
		...(meta ? {meta} : {}),
	})
	const LIST = {pages: [['first'], ['second'], ['third']], pageParams: [1, 2, 3]}

	/** What the persister writes for these queries, read back. */
	function written(queries: Array<ReturnType<typeof cached>>): PersistedClient {
		let client = {timestamp: 1, buster: '', clientState: {mutations: [], queries}}
		return JSON.parse(serializeCache(client as unknown as PersistedClient)) as PersistedClient
	}
	const dehydrates = (query: ReturnType<typeof cached>) =>
		persistOptions.dehydrateOptions.shouldDehydrateQuery(query as unknown as Query)

	test('stays out of storage with `persist: false`, even when it succeeded', () => {
		expect(
			dehydrates(cached(['mess', 'issue'], {status: 'success', data: []}, {persist: false})),
		).toBe(false)
		expect(
			dehydrates(cached(['mess', 'issue'], {status: 'success', data: []}, {persist: true})),
		).toBe(true)
	})

	test('is written with only its first pages, as loaded, with `persistPages`', () => {
		let cache = written([
			cached(['a-list'], {status: 'success', data: LIST}, {persistPages: 1}),
			// Shaped like a list of pages too, to show only a query that asks is cut.
			cached(['news', 'stolaf'], {status: 'success', data: LIST}),
		])
		expect(cache.clientState.queries.map((query) => query.state.data)).toStrictEqual([
			{pages: [['first']], pageParams: [1]},
			LIST,
		])
	})

	// A further page that fails leaves a list in an error state, but the pages it loaded stand.
	test('persists its pages after a further page fails, written as loaded', () => {
		let failed = cached(
			['a-list'],
			{status: 'error', data: LIST, error: {}, fetchFailureCount: 1},
			{persistPages: 1},
		)
		expect(dehydrates(failed)).toBe(true)
		expect(written([failed]).clientState.queries[0]?.state).toMatchObject({
			status: 'success',
			error: null,
			fetchFailureCount: 0,
			data: {pages: [['first']], pageParams: [1]},
		})
	})

	test('persists no failed list without pages, nor any other failed query', () => {
		expect(dehydrates(cached(['a-list'], {status: 'error'}, {persistPages: 1}))).toBe(false)
		expect(dehydrates(cached(['news', 'stolaf'], {status: 'error', data: LIST}))).toBe(false)
	})
})

/** A persister holding one saved cache, written with `buster`, in memory. */
function savedBy(buster: string): Persister {
	let source = new QueryClient()
	source.setQueryData(['map-categories'], {stolaf: []})
	let saved: PersistedClient = {buster, timestamp: Date.now(), clientState: dehydrate(source)}
	source.clear()
	return {
		persistClient: () => undefined,
		restoreClient: () => saved,
		removeClient: () => undefined,
	}
}

async function restoredData(persister: Persister): Promise<unknown> {
	let queryClient = new QueryClient()
	try {
		await persistQueryClientRestore({queryClient, persister, buster: persistOptions.buster})
		return queryClient.getQueryData(['map-categories'])
	} finally {
		queryClient.clear()
	}
}

// A query's data can change shape between builds, and a restored copy never
// passes through the fetch that checks it. An older build's cache is dropped
// rather than handed to code written for another shape.
describe('a cache saved by another build', () => {
	test('is dropped, including one saved with no buster', async () => {
		await expect(restoredData(savedBy(''))).resolves.toBeUndefined()
	})

	test('is restored when this build saved it', async () => {
		await expect(restoredData(savedBy(persistOptions.buster))).resolves.toEqual({stolaf: []})
	})
})
