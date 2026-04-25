import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

interface FilterState {
	selectedSports: string[]
	setSelectedSports: (sports: string[]) => void
	toggleSport: (sport: string) => void
}

export const useFilterStore = create<FilterState>()(
	persist(
		(set) => ({
			selectedSports: [],
			setSelectedSports: (sports) => set({selectedSports: sports}),
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
