import type {PersistedState} from 'redux-persist'

/**
 * A new entry in `initialState` only reaches a fresh install -- redux-persist's
 * default reconciler swaps the stored slice in wholesale, so anyone who has
 * already opened the app keeps the calendar list they were given the first
 * time. Presence is on by default, and that has to mean everyone.
 */
function addPresenceCalendar(state: PersistedState): PersistedState {
	// PersistedState is deliberately opaque; this migration knows the shape of
	// the slice it is repairing.
	let previous = state as Record<string, {enabledCalendarSources?: string[]}> | undefined
	let settings = previous?.settings
	if (!previous || !settings) return state

	let enabled = settings.enabledCalendarSources ?? []
	if (enabled.includes('presence')) return state

	return {
		...previous,
		settings: {...settings, enabledCalendarSources: [...enabled, 'presence']},
	} as unknown as PersistedState
}

export const migrations = {
	2: addPresenceCalendar,
}
