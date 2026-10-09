import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import {recordRequest, removeRequest, type RequestHistory, type SavedRequest} from './util/history'

type ApiTestStore = {
	/** Requests sent from the API Tester, kept so they can be filled back in. */
	history: RequestHistory
	record: (route: string, request: SavedRequest) => void
	remove: (route: string, request: SavedRequest) => void
	clear: () => void
}

export const useApiTestStore = create<ApiTestStore>()(
	persist(
		(set) => ({
			history: [],
			record: (route, request) =>
				set((state) => ({history: recordRequest(state.history, route, request)})),
			remove: (route, request) =>
				set((state) => ({history: removeRequest(state.history, route, request)})),
			clear: () => set({history: []}),
		}),
		{
			name: 'api-test-history',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({history: state.history}),
		},
	),
)

/** The key a route's history is filed under: its method and path. */
export function routeKey(method: string, path: string): string {
	return `${method} ${path}`
}

/**
 * The key a route's remembered requests are filed under: the campus too, since
 * each campus has its own server, and values sent to one (a cafe id, a calendar)
 * mean nothing to another's.
 */
export function historyKey(campus: string, route: string): string {
	return `${campus} ${route}`
}
