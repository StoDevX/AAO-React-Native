import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import type {Campus} from '../building-hours/types'
import {withoutRecentPlace, withRecentPlace} from './lib/recent-places'

export interface RecentPlacesState {
	/// Place ids opened on each campus's map, most recent first.
	recent: Record<Campus, string[]>
	remember: (campus: Campus, id: string) => void
	forget: (campus: Campus, id: string) => void
	clear: (campus: Campus) => void
}

export const useRecentPlacesStore = create<RecentPlacesState>()(
	persist(
		(set) => ({
			recent: {stolaf: [], carleton: []},
			remember: (campus, id) =>
				set((state) => ({
					recent: {...state.recent, [campus]: withRecentPlace(state.recent[campus], id)},
				})),
			forget: (campus, id) =>
				set((state) => ({
					recent: {...state.recent, [campus]: withoutRecentPlace(state.recent[campus], id)},
				})),
			clear: (campus) => set((state) => ({recent: {...state.recent, [campus]: []}})),
		}),
		{
			name: 'map-recent-places',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({recent: state.recent}),
		},
	),
)
