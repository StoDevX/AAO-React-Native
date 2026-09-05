import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type CalendarFilterStore = {
	selectedCategories: string[]
	setSelectedCategories: (categories: string[]) => void
	toggleCategory: (category: string) => void
	clearCategories: () => void
}

export const useCalendarFilterStore = create<CalendarFilterStore>()(
	persist(
		(set) => ({
			selectedCategories: [],
			setSelectedCategories: (categories) => set({selectedCategories: categories}),
			toggleCategory: (category) =>
				set((state) => ({
					selectedCategories: state.selectedCategories.includes(category)
						? state.selectedCategories.filter((c) => c !== category)
						: [...state.selectedCategories, category],
				})),
			clearCategories: () => set({selectedCategories: []}),
		}),
		{
			name: 'calendar-filter-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
