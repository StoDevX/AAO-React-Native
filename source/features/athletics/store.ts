import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

export interface FilterState {
	selectedSports: string[]
	availableSports: string[]
	setSelectedSports: (sports: string[]) => void
	setAvailableSports: (sports: string[]) => void
	toggleSport: (sport: string) => void
}

function sameSports(a: string[], b: string[]): boolean {
	return a.length === b.length && a.every((sport, i) => sport === b[i])
}

export const useFilterStore = create<FilterState>()(
	persist(
		(set) => ({
			selectedSports: [],
			availableSports: [],
			setSelectedSports: (sports) => set({selectedSports: sports}),
			// Called from an effect on every data fetch, so a same-list call must
			// not produce a new state object — that would re-render every subscriber.
			setAvailableSports: (sports) =>
				set((state) =>
					sameSports(state.availableSports, sports) ? state : {availableSports: sports},
				),
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
			// availableSports is derived from each fetch, not user choice; persisting
			// it would rehydrate a stale sports list from a previous season.
			partialize: (state) => ({selectedSports: state.selectedSports}),
		},
	),
)

/** An empty selection means every sport is shown; a non-empty one narrows the list. */
export function isFilterActive(selectedSports: string[]): boolean {
	return selectedSports.length > 0
}

export function selectShowChangeFiltersMessage(state: FilterState): boolean {
	const {selectedSports, availableSports} = state
	// Show the hint when the user has explicitly selected some sports but at
	// least one currently-available sport is excluded from their selection.
	return isFilterActive(selectedSports) && !availableSports.every((s) => selectedSports.includes(s))
}
