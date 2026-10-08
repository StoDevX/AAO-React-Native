import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import type {Campus} from '../building-hours/types'

export type {Campus}

/** The campuses the Home menu offers, in its order. */
export const CAMPUSES: ReadonlyArray<{campus: Campus; title: string}> = [
	{campus: 'stolaf', title: 'St. Olaf College'},
	{campus: 'carleton', title: 'Carleton College'},
]

type CampusStore = {
	/**
	 * The campus the app is for. Only dev mode offers the choice, but the choice
	 * stays when dev mode is switched off, so a Carleton install stays Carleton.
	 */
	campus: Campus
	setCampus: (campus: Campus) => void
	/**
	 * Whether the saved campus has loaded. Until it has, `campus` is only the
	 * default, and Home would draw St. Olaf's tiles and then jump to Carleton's.
	 */
	hydrated: boolean
}

export const useCampusStore = create<CampusStore>()(
	persist(
		(set) => ({
			campus: 'stolaf',
			setCampus: (campus) => set({campus}),
			hydrated: false,
		}),
		{
			name: 'campus',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({campus: state.campus}),
			onRehydrateStorage: () => () => useCampusStore.setState({hydrated: true}),
		},
	),
)

/** The campus the app is for. */
export function useCampus(): Campus {
	return useCampusStore((state) => state.campus)
}
