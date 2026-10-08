import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import {APP} from '../../lib/app-identity'
import type {Campus} from '../building-hours/types'

export type {Campus}

/** The campuses the Home menu offers, in its order. */
export const CAMPUSES: ReadonlyArray<{campus: Campus; title: string}> = [
	{campus: 'stolaf', title: 'St. Olaf College'},
	{campus: 'carleton', title: 'Carleton College'},
]

/** CARLS is Carleton's app and nothing else; only All About Olaf switches campus. */
export const CAMPUS_IS_FIXED = APP === 'carls'

const STARTING_CAMPUS: Campus = CAMPUS_IS_FIXED ? 'carleton' : 'stolaf'

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
			campus: STARTING_CAMPUS,
			setCampus: (campus) => {
				if (!CAMPUS_IS_FIXED) set({campus})
			},
			hydrated: false,
		}),
		{
			name: 'campus',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({campus: state.campus}),
			// A campus saved by a build that could switch never overrides CARLS' own.
			merge: (persisted, current) =>
				CAMPUS_IS_FIXED ? current : {...current, ...(persisted as Partial<CampusStore>)},
			onRehydrateStorage: () => () => useCampusStore.setState({hydrated: true}),
		},
	),
)

/** The campus the app is for. */
export function useCampus(): Campus {
	return useCampusStore((state) => state.campus)
}
