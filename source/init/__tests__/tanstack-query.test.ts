import {dehydrate, QueryClient, type Query} from '@tanstack/react-query'
import {
	persistQueryClientRestore,
	type PersistedClient,
	type Persister,
} from '@tanstack/react-query-persist-client'

import {manifestOptions} from '@frogpond/data-sources'
import {serverRoutesOptions} from '../../features/developer/api-test/query'

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

	// A refetch that fails leaves the data it had in the cache, and it stands in storage too.
	test('persists the data it had after a refetch fails, written as loaded, with `persistAfterFailure`', () => {
		let failed = cached(
			['data-sources', 'manifest'],
			{status: 'error', data: {links: []}, error: {}, fetchFailureCount: 1},
			{persistAfterFailure: true},
		)
		expect(dehydrates(failed)).toBe(true)
		expect(written([failed]).clientState.queries[0]?.state).toMatchObject({
			status: 'success',
			error: null,
			fetchFailureCount: 0,
			data: {links: []},
		})
	})

	test('persists nothing for a failed query with `persistAfterFailure` that never loaded', () => {
		expect(
			dehydrates(
				cached(['data-sources', 'manifest'], {status: 'error'}, {persistAfterFailure: true}),
			),
		).toBe(false)
	})

	test('persists no failed list without pages, nor any other failed query', () => {
		expect(dehydrates(cached(['a-list'], {status: 'error'}, {persistPages: 1}))).toBe(false)
		expect(dehydrates(cached(['news', 'stolaf'], {status: 'error', data: LIST}))).toBe(false)
	})
})

describe('the sources manifest', () => {
	// The radio plays from the cached manifest however old it is, so a failed
	// refresh on one launch must not leave the next launch with none.
	test('stays in storage after a refresh fails', async () => {
		let client = new QueryClient()
		try {
			client.setQueryData(manifestOptions.queryKey, {subject: 'cached', links: []}, {updatedAt: 0})
			await client
				.query({...manifestOptions, queryFn: () => Promise.reject(new Error('offline'))})
				.catch(() => undefined)
			expect(client.getQueryState(manifestOptions.queryKey)?.status).toBe('error')

			let dehydrated = dehydrate(client, persistOptions.dehydrateOptions)
			let saved = {timestamp: 1, buster: '', clientState: dehydrated} as PersistedClient
			let [manifest] = (JSON.parse(serializeCache(saved)) as PersistedClient).clientState.queries
			expect(manifest?.state).toMatchObject({status: 'success', data: {subject: 'cached'}})
		} finally {
			client.clear()
		}
	})
})

describe("the API Tester's route list", () => {
	// It describes the server the app points at now: restored from storage it
	// would show another server's routes, or an older shape of this one's.
	test('stays out of storage, even when it loaded', async () => {
		let client = new QueryClient()
		try {
			await client.query({...serverRoutesOptions, queryFn: () => Promise.resolve([])})
			expect(client.getQueryState(serverRoutesOptions.queryKey)?.status).toBe('success')

			let dehydrated = dehydrate(client, persistOptions.dehydrateOptions)
			expect(dehydrated.queries.map((query) => query.queryKey)).not.toContainEqual(
				serverRoutesOptions.queryKey,
			)
		} finally {
			client.clear()
		}
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
