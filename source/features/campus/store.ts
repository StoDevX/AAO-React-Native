import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import {uiTestCampus} from '@frogpond/launch-arguments'

import {DEFAULT_CAMPUS} from '../../lib/app-identity'
import {
	type CampusDefinition,
	type CampusId,
	campusById,
	isCampusId,
	requireCampusId,
} from '../../campuses'

export type {CampusDefinition, CampusId}

/** The campus a UI test named; its recordings answer this load. */
const TEST_CAMPUS: CampusId | null =
	typeof uiTestCampus === 'string' ? requireCampusId(uiTestCampus, '--campus') : null

/** The campus this build opens on when nothing is saved; null asks with the picker. */
const BUILD_DEFAULT: CampusId | null =
	DEFAULT_CAMPUS === null ? null : requireCampusId(DEFAULT_CAMPUS, "app.config.ts's defaultCampus")

type CampusStore = {
	/**
	 * The campus the app is for, or null until someone picks one in a build
	 * with no default. Dev mode can switch it in any build.
	 */
	campus: CampusId | null
	setCampus: (campus: CampusId) => void
	/**
	 * Whether the saved campus has loaded. Until it has, `campus` is only the
	 * default, and Home would draw one campus's tiles and then jump to another's.
	 */
	hydrated: boolean
}

export const useCampusStore = create<CampusStore>()(
	persist(
		(set) => ({
			campus: TEST_CAMPUS ?? BUILD_DEFAULT,
			setCampus: (campus) => set({campus}),
			hydrated: false,
		}),
		{
			name: 'campus',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({campus: state.campus}),
			// A UI test's campus beats a saved one. A saved value this build
			// doesn't know, such as a 2.9 RC's 'carleton', is ignored.
			merge: (persisted, current) => {
				let saved = (persisted as Partial<CampusStore> | undefined)?.campus
				if (TEST_CAMPUS !== null || !isCampusId(saved)) {
					return current
				}
				return {...current, campus: saved}
			},
			onRehydrateStorage: () => () => useCampusStore.setState({hydrated: true}),
		},
	),
)

function chosen(campus: CampusId | null): CampusId {
	if (campus === null) {
		throw new Error('No campus is chosen yet; the root layout shows the campus picker first')
	}
	return campus
}

/** The active campus's id. Only screens behind the picker call it. */
export function useCampusId(): CampusId {
	return chosen(useCampusStore((state) => state.campus))
}

/** The active campus's definition. */
export function useCampus(): CampusDefinition {
	return campusById(useCampusId())
}

/** One section of the active campus's definition; undefined where the campus lacks it. */
export function useCampusSection<K extends keyof CampusDefinition>(key: K): CampusDefinition[K] {
	return useCampus()[key]
}

/** The active campus's id, for code outside a component, read when it is called. */
export function currentCampusId(): CampusId {
	return chosen(useCampusStore.getState().campus)
}

/** The active campus's definition, for code outside a component, read when it is called. */
export function currentCampus(): CampusDefinition {
	return campusById(currentCampusId())
}

// MARK: Legacy bridge, deleted by the last PR of this stack once nothing calls it.

/** The id features compared against before campus definitions. */
export type LegacyCampus = 'stolaf' | 'carleton'

/** The pre-registry name for LegacyCampus, still imported by unmigrated features. */
export type Campus = LegacyCampus

const LEGACY: Record<CampusId, LegacyCampus> = {'edu.stolaf': 'stolaf', 'edu.carleton': 'carleton'}

/** Bridge only: read a section of `useCampus()` instead. */
export function legacyCampusOf(id: CampusId): LegacyCampus {
	return LEGACY[id]
}

/** The id a legacy campus name stands for. */
export function campusIdOfLegacy(campus: LegacyCampus): CampusId {
	return campus === 'stolaf' ? 'edu.stolaf' : 'edu.carleton'
}

/** Bridge only: read a section of `useCampus()` instead. */
export function useLegacyCampus(): LegacyCampus {
	return legacyCampusOf(useCampusId())
}

/** Bridge only: read a section of `currentCampus()` instead. */
export function currentLegacyCampus(): LegacyCampus {
	return legacyCampusOf(currentCampusId())
}
