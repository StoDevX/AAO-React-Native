import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import {createLayoutStore} from '../../lib/layout-store'

/** How home lays its tiles out: one grid of every tile, a grid per named group, or a list. */
export type HomeLayout = 'tiled' | 'grouped' | 'list'

export const useHomeLayoutStore = createLayoutStore<HomeLayout>('home-layout-preference', 'tiled')

interface CollapsedGroupsState {
	/**
	 * The home groups a person has collapsed, by id. Kept as plain strings
	 * rather than `HomeGroupId`: a stored id can outlive the group it named, and
	 * one that matches nothing is simply never read.
	 */
	collapsedGroups: string[]
	toggleGroup: (id: string) => void
	/** Whether the saved groups have loaded; see `createLayoutStore`. */
	hydrated: boolean
}

export const useCollapsedGroupsStore = create<CollapsedGroupsState>()(
	persist(
		(set) => ({
			collapsedGroups: [],
			toggleGroup: (id) =>
				set((state) => ({
					collapsedGroups: state.collapsedGroups.includes(id)
						? state.collapsedGroups.filter((group) => group !== id)
						: [...state.collapsedGroups, id],
				})),
			hydrated: false,
		}),
		{
			name: 'home-collapsed-groups',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({collapsedGroups: state.collapsedGroups}),
			onRehydrateStorage: () => () => useCollapsedGroupsStore.setState({hydrated: true}),
		},
	),
)
