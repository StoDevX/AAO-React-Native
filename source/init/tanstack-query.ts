import {AppState, Platform} from 'react-native'
import {addEventListener} from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Application from 'expo-application'
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister'
import type {PersistedClient} from '@tanstack/react-query-persist-client'
import {firstPagesOf, isInfiniteData} from '../lib/infinite-data'
import {
	QueryClient,
	onlineManager,
	focusManager,
	defaultShouldDehydrateQuery,
	type Query,
} from '@tanstack/react-query'

//
// Set up caching
//

const oneDayInMs = 1000 * 60 * 60 * 24 // 24 hours

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: oneDayInMs,
		},
	},
})

/** How a query asks to be persisted, in its `meta`. */
type PersistMeta = {
	/** False keeps the query out of storage, even when it succeeded */
	persist?: boolean
	/** An infinite query persists only this many of its first pages, and persists them even after a later page fails */
	persistPages?: number
	/** True persists the data a query last loaded even after a refetch fails, as loaded, so a failure cannot erase it from storage */
	persistAfterFailure?: boolean
}

/** The persistence a query asks for, read from its `meta`, which carries no type of its own. */
function persistMeta(meta: unknown): PersistMeta {
	if (typeof meta !== 'object' || meta === null) return {}
	let {persist, persistPages, persistAfterFailure} = meta as Record<string, unknown>
	return {
		persist: typeof persist === 'boolean' ? persist : undefined,
		persistPages: typeof persistPages === 'number' ? persistPages : undefined,
		persistAfterFailure: persistAfterFailure === true,
	}
}

/** `query` written as having loaded `data`, with no failure, since the failure did not take the data with it. */
function asLoaded<Q extends PersistedClient['clientState']['queries'][number]>(
	query: Q,
	data: unknown,
): Q {
	return {
		...query,
		state: {
			...query.state,
			data,
			status: 'success' as const,
			error: null,
			fetchFailureCount: 0,
			fetchFailureReason: null,
		},
	}
}

/**
 * How the persisted cache is written: as JSON, with each query that sets `persistPages` cut to its
 * first pages and written as loaded, since any failure belonged to a later page. The whole cache is
 * one AsyncStorage value, and a list paged through would otherwise grow it for good. A query that
 * sets `persistAfterFailure` is written as loaded too, with the data it had before a refetch failed.
 */
export function serializeCache(client: PersistedClient): string {
	let queries = client.clientState.queries.map((query) => {
		let {persistPages, persistAfterFailure} = persistMeta(query.meta)
		let data = query.state.data
		if (persistPages !== undefined && isInfiniteData(data)) {
			return asLoaded(query, firstPagesOf(data, persistPages))
		}
		if (persistAfterFailure && query.state.status === 'error' && data !== undefined) {
			return asLoaded(query, data)
		}
		return query
	})
	return JSON.stringify({...client, clientState: {...client.clientState, queries}})
}

export const persister = createAsyncStoragePersister({
	storage: AsyncStorage,
	serialize: serializeCache,
})

/**
 * Whether a query belongs to the calendar, whose data lives in SQLite rather
 * than in the query cache.
 *
 * Matched as a **prefix**, not by equality, and that is the whole point. The
 * ingest receipt keys on `'calendar'` and the three read hooks in
 * `source/database/calendar/read.ts` key on `'calendar-db'`; an exact
 * comparison caught the first and dehydrated all three of the others, whose
 * `SourcedEvent`s carry `Moment`s that `JSON.stringify` flattens to strings
 * and `JSON.parse` restores as strings. A prefix covers the key somebody adds
 * next as well, which an exact list does not -- and `scheduleCalendarOptions`
 * already documents its own key as deliberately *not* starting with
 * `'calendar'` for exactly this reason, so the prefix is the rule the rest of
 * the codebase was already written against.
 */
export function isCalendarQueryKey(queryKey: readonly unknown[]): boolean {
	let [head] = queryKey
	return typeof head === 'string' && head.startsWith('calendar')
}

export const persistOptions = {
	persister,
	// A query's data can change shape between builds, and a restored copy
	// never passes through the fetch that checks it, so a cache saved by any
	// other build is dropped on launch rather than handed to this one. A cache
	// saved with no buster never matches either.
	buster: `${Application.nativeApplicationVersion}+${Application.nativeBuildVersion}`,
	dehydrateOptions: {
		// The calendar's data lives in SQLite: the ingest query returns only a
		// receipt saying a write happened, and the read hooks return a window
		// hydrated out of the database. Persisting a receipt would let a restored
		// one describe a database that no longer exists -- after a corrupt-db
		// reset, a schema bump, or refreshApp clearing AsyncStorage -- and React
		// Query would treat it as fresh, so the screen would show no rows and not
		// refetch until stale time elapsed. Persisting a read would be worse: it
		// rebuilds the JSON blob this database exists to replace, and restores
		// `Moment`s as strings. Unpersisted, a cold launch always fetches, while
		// reads serve the previous window straight from SQLite.
		// Composed with the default, never replacing it. `defaultShouldDehydrateQuery`
		// is `query.state.status === 'success'`; replacing it would start persisting
		// failed and pending queries for every other feature in the app -- news,
		// dining, directory, building hours -- writing error states to AsyncStorage
		// and restoring them on launch. Verified against @tanstack/query-core 5.102.8.
		// A query can also set its own rule in `meta` (see `PersistMeta`).
		shouldDehydrateQuery: (query: Query): boolean => {
			if (isCalendarQueryKey(query.queryKey)) return false
			let {persist, persistPages, persistAfterFailure} = persistMeta(query.meta)
			if (persist === false) return false
			if (persistPages !== undefined && isInfiniteData(query.state.data)) return true
			if (persistAfterFailure && query.state.data !== undefined) return true
			return defaultShouldDehydrateQuery(query)
		},
	},
}

//
// Enable auto-refresh on app switch or network reconnect
//

// ... on network reconnect
onlineManager.setEventListener((setOnline) => {
	return addEventListener((state) => {
		setOnline(Boolean(state.isConnected))
	})
})

// ... on app resume
AppState.addEventListener('change', (status) => {
	if (Platform.OS !== 'web') {
		focusManager.setFocused(status === 'active')
	}
})
