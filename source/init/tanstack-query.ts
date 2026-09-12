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

export const persistOptions = {
	persister,
	dehydrateOptions: {
		// The calendar's data lives in SQLite; these queries return only a
		// receipt saying a write happened. Persisting one would let a restored
		// receipt describe a database that no longer exists -- after a corrupt-db
		// reset, a schema bump, or refreshApp clearing AsyncStorage -- and React
		// Query would treat it as fresh, so the screen would show no rows and not
		// refetch until stale time elapsed. Unpersisted, a cold launch always
		// fetches, while reads serve the previous window straight from SQLite.
		// Composed with the default, never replacing it. `defaultShouldDehydrateQuery`
		// is `query.state.status === 'success'`; replacing it would start persisting
		// failed and pending queries for every other feature in the app -- news,
		// dining, directory, building hours -- writing error states to AsyncStorage
		// and restoring them on launch. Verified against @tanstack/query-core 5.102.8.
		shouldDehydrateQuery: (query: Query): boolean =>
			defaultShouldDehydrateQuery(query) && query.queryKey[0] !== 'calendar',
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
