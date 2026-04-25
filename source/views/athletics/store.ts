import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

interface FilterState {
	selectedSports: string[]
	totalSports: number
	setSelectedSports: (sports: string[]) => void
	setTotalSports: (count: number) => void
	toggleSport: (sport: string) => void
}

export const useFilterStore = create<FilterState>()(
	persist(
		(set) => ({
			selectedSports: [],
			totalSports: 0,
			setSelectedSports: (sports) => set({selectedSports: sports}),
			setTotalSports: (count) => set({totalSports: count}),
			toggleSport: (sport) =>
				set((state) => {
					const isSelected = state.selectedSports.includes(sport)
					return {
						selectedSports: isSelected
							? state.selectedSports.filter((s) => s !== sport)
							: [...state.selectedSports, sport],
					}
				}),
		}),
		{
			name: 'athletics-filter-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)

export function selectShowChangeFiltersMessage(state: FilterState): boolean {
	const {selectedSports, totalSports} = state
	const allFiltersSelected = selectedSports.length === totalSports
	return selectedSports.length > 0 && !allFiltersSelected
}
