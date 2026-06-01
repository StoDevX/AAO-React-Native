import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

interface FilterState {
	selectedSports: string[]
	availableSports: string[]
	_hasHydrated: boolean
	setSelectedSports: (sports: string[]) => void
	setAvailableSports: (sports: string[]) => void
	toggleSport: (sport: string) => void
	setHasHydrated: (value: boolean) => void
}

export const useFilterStore = create<FilterState>()(
	persist(
		(set) => ({
			selectedSports: [],
			availableSports: [],
			_hasHydrated: false,
			setSelectedSports: (sports) => set({selectedSports: sports}),
			setAvailableSports: (sports) => set({availableSports: sports}),
			setHasHydrated: (value) => set({_hasHydrated: value}),
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
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true)
			},
		},
	),
)

export function selectShowChangeFiltersMessage(state: FilterState): boolean {
	const {selectedSports, availableSports} = state
	// Show the hint when the user has explicitly selected some sports but at
	// least one currently-available sport is excluded from their selection.
	return (
		selectedSports.length > 0 &&
		!availableSports.every((s) => selectedSports.includes(s))
	)
}
