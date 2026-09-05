import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type CalendarFilterStore = {
	selectedCategories: string[]
	setSelectedCategories: (categories: string[]) => void
	clearCategories: () => void
}

export const useCalendarFilterStore = create<CalendarFilterStore>()(
	persist(
		(set) => ({
			selectedCategories: [],
			setSelectedCategories: (categories) => set({selectedCategories: categories}),
			clearCategories: () => set({selectedCategories: []}),
		}),
		{
			name: 'calendar-filter-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
