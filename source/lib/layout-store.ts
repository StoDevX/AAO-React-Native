import AsyncStorage from '@react-native-async-storage/async-storage'
import {create, type Mutate, type StoreApi, type UseBoundStore} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

/** How a screen with a layout menu draws its items: as tiles or as rows. */
export type Layout = 'grid' | 'list'

type LayoutStore = {
	layout: Layout
	setLayout: (layout: Layout) => void
}

type PersistedLayoutStore = UseBoundStore<
	Mutate<StoreApi<LayoutStore>, [['zustand/persist', unknown]]>
>

/**
 * A screen's choice from its layout menu, kept across launches under `name`.
 * Each screen gets its own, so picking a list on one leaves another's grid
 * alone.
 */
export function createLayoutStore(name: string, initial: Layout): PersistedLayoutStore {
	return create<LayoutStore>()(
		persist(
			(set) => ({
				layout: initial,
				setLayout: (layout) => set({layout}),
			}),
			{
				name,
				storage: createJSONStorage(() => AsyncStorage),
				version: 1,
			},
		),
	)
}
