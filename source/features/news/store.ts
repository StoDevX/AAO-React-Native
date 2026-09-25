import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type NewsFilterStore = {
	/** The chosen category keyed by source id; absent or null shows every story */
	selectedCategories: Record<string, string | null>
	select: (source: string, category: string | null) => void
}

/**
 * Version 1 holds one source and its category, which doesn't map onto
 * per-source filters, so it is dropped. Without this function zustand drops it
 * anyway, but logs an error.
 */
export function migrate(
	_state: unknown,
	_version: number,
): Pick<NewsFilterStore, 'selectedCategories'> {
	return {selectedCategories: {}}
}

export const useNewsFilterStore = create<NewsFilterStore>()(
	persist(
		(set) => ({
			selectedCategories: {},
			select: (source, category) =>
				set((state) => ({
					selectedCategories: {...state.selectedCategories, [source]: category},
				})),
		}),
		{
			name: 'news-filter-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 2,
			migrate,
		},
	),
)
