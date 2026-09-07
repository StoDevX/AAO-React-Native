import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type NewsFilterStore = {
	selectedSource: string
	selectedCategory: string | null
	select: (source: string, category: string | null) => void
}

export const useNewsFilterStore = create<NewsFilterStore>()(
	persist(
		(set) => ({
			selectedSource: 'stolaf',
			selectedCategory: null,
			select: (source, category) => set({selectedSource: source, selectedCategory: category}),
		}),
		{
			name: 'news-filter-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
