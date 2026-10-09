import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import type {CampusId} from '../../campuses/ids'
import {withoutRecentPlace, withRecentPlace} from './lib/recent-places'

export interface RecentPlacesState {
	/// Place ids opened on each campus's map, most recent first. A campus
	/// whose map has opened nothing has no key.
	recent: Partial<Record<CampusId, string[]>>
	remember: (campus: CampusId, id: string) => void
	forget: (campus: CampusId, id: string) => void
	clear: (campus: CampusId) => void
}

export const useRecentPlacesStore = create<RecentPlacesState>()(
	persist(
		(set) => ({
			recent: {},
			remember: (campus, id) =>
				set((state) => ({
					recent: {...state.recent, [campus]: withRecentPlace(state.recent[campus] ?? [], id)},
				})),
			forget: (campus, id) =>
				set((state) => ({
					recent: {...state.recent, [campus]: withoutRecentPlace(state.recent[campus] ?? [], id)},
				})),
			clear: (campus) => set((state) => ({recent: {...state.recent, [campus]: []}})),
		}),
		{
			name: 'map-recent-places',
			storage: createJSONStorage(() => AsyncStorage),
			// Version 1 keyed recents by the ids 2.9's release candidates used
			// (`stolaf`, `carleton`). They are dropped, not carried over.
			version: 2,
			migrate: () => ({recent: {}}),
			partialize: (state) => ({recent: state.recent}),
		},
	),
)
