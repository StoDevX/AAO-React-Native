import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type CalendarFilterStore = {
	selectedCategory: string | null
	selectCategory: (category: string | null) => void
}

export const useCalendarFilterStore = create<CalendarFilterStore>()(
	persist(
		(set) => ({
			selectedCategory: null,
			selectCategory: (category) => set({selectedCategory: category}),
		}),
		{
			name: 'calendar-filter-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 2,
		},
	),
)
