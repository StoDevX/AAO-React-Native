import {AppState, Platform} from 'react-native'

import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister'
import {focusManager, onlineManager, QueryClient} from '@tanstack/react-query'

//
// Set up caching
//

const oneDayInMs = 1000 * 60 * 60 * 24 // 24 hours

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			cacheTime: oneDayInMs,
		},
	},
})

export const persister = createAsyncStoragePersister({storage: AsyncStorage})

//
// Enable auto-refresh on app switch or network reconnect
//

// ... on network reconnect
onlineManager.setEventListener((setOnline) => {
	return NetInfo.addEventListener((state) => {
		setOnline(Boolean(state.isConnected))
	})
})

// ... on app resume
AppState.addEventListener('change', (status) => {
	if (Platform.OS !== 'web') {
		focusManager.setFocused(status === 'active')
	}
})
