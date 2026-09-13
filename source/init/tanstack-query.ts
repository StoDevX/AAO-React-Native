import {AppState, Platform} from 'react-native'
import {addEventListener} from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister'
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

export const persister = createAsyncStoragePersister({storage: AsyncStorage})

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
		shouldDehydrateQuery: (query: Query): boolean =>
			defaultShouldDehydrateQuery(query) && !isCalendarQueryKey(query.queryKey),
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
