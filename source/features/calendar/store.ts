import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

/**
 * What the calendar is narrowed to, and along which axis. One selection at a
 * time rather than one per axis: a Presence event has no category and a campus
 * calendar event has no organisation, so a filter requiring both to match
 * would empty the list for every possible pair of selections.
 */
export type CalendarFilter = {
	axis: 'category' | 'organization'
	value: string
}

type CalendarFilterStore = {
	filter: CalendarFilter | null
	selectFilter: (filter: CalendarFilter | null) => void
}

type PersistedV2 = {selectedCategory?: string | null}

/**
 * Version 2 stored a bare category name. Exported so the migration can be
 * tested directly -- zustand only runs it against real stored state.
 */
export function migrate(state: unknown, version: number): unknown {
	if (version >= 3) return state

	let {selectedCategory} = (state ?? {}) as PersistedV2
	return {filter: selectedCategory ? {axis: 'category', value: selectedCategory} : null}
}

export const useCalendarFilterStore = create<CalendarFilterStore>()(
	persist(
		(set) => ({
			filter: null,
			selectFilter: (filter) => set({filter}),
		}),
		{
			name: 'calendar-filter-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 3,
			migrate,
		},
	),
)
