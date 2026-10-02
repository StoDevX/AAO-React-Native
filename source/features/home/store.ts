import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

/** How home lays its tiles out: one grid of every tile, a grid per named group, or a list. */
export type HomeLayout = 'tiled' | 'grouped' | 'list'

interface HomeLayoutState {
	layout: HomeLayout
	setLayout: (layout: HomeLayout) => void
}

export const useHomeLayoutStore = create<HomeLayoutState>()(
	persist(
		(set) => ({
			layout: 'grouped',
			setLayout: (layout) => set({layout}),
		}),
		{
			name: 'home-layout-preference',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
