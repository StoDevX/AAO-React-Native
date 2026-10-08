import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import {campusFixturesDomain, isUITesting} from '@frogpond/launch-arguments'

import {APP} from '../../lib/app-identity'
import {campusFromDomain} from './domains'
import type {Campus} from '../building-hours/types'

export type {Campus}

/** The campuses the Home menu offers, in its order. */
export const CAMPUSES: ReadonlyArray<{campus: Campus; title: string}> = [
	{campus: 'stolaf', title: 'St. Olaf College'},
	{campus: 'carleton', title: 'Carleton College'},
]

/** CARLS is Carleton's app and nothing else; only All About Olaf switches campus. */
export const CAMPUS_IS_FIXED = APP === 'carls'

/** The campus a UI test named, whose recordings this load serves. */
const TEST_CAMPUS: Campus | null =
	isUITesting && campusFixturesDomain !== null ? campusFromDomain(campusFixturesDomain) : null

const STARTING_CAMPUS: Campus = CAMPUS_IS_FIXED ? 'carleton' : (TEST_CAMPUS ?? 'stolaf')

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
			// A campus saved by a build that could switch never overrides CARLS' own,
			// nor the campus a UI test names.
			merge: (persisted, current) =>
				CAMPUS_IS_FIXED || TEST_CAMPUS !== null
					? current
					: {...current, ...(persisted as Partial<CampusStore>)},
			onRehydrateStorage: () => () => useCampusStore.setState({hydrated: true}),
		},
	),
)

/** The campus the app is for. */
export function useCampus(): Campus {
	return useCampusStore((state) => state.campus)
}
