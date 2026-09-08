import type {MigrationManifest, PersistedState} from 'redux-persist'

import {DEFAULT_CALENDAR_SOURCES} from './parts/settings'

/**
 * The shape of persisted root state that this migration actually reads and
 * writes. `redux-persist`'s own `PersistedState` type is deliberately opaque
 * -- it knows nothing about the app's slices -- so this describes the slice
 * this migration cares about instead.
 */
interface PersistedRootState {
	settings?: {enabledCalendarSources?: string[]; [key: string]: unknown}
	[key: string]: unknown
}

/**
 * A new entry in `initialState` only reaches a fresh install -- redux-persist's
 * default reconciler swaps the stored slice in wholesale, so anyone who has
 * already opened the app keeps the calendar list they were given the first
 * time. Presence is on by default, and that has to mean everyone.
 *
 * A stored list naming no calendars and no stored list at all are different
 * states, and the body says why they are treated differently.
 */
function addPresenceCalendar(
	state: PersistedRootState | undefined,
): PersistedRootState | undefined {
	let settings = state?.settings
	if (!state || !settings) return state

	let enabled = settings.enabledCalendarSources

	// An install older than the field itself rehydrates without the key at all
	// -- `autoMergeLevel1` swaps the stored slice in whole, so it never gains
	// one by merging -- and has been reading the defaults through
	// `selectEnabledCalendarSources` ever since. Writing `['presence']` over
	// that would take the campus calendar away from a user who never turned it
	// off. An explicitly empty list is a choice the user made, so it keeps that
	// choice and only gains Presence.
	if (!enabled) {
		return {
			...state,
			settings: {...settings, enabledCalendarSources: [...DEFAULT_CALENDAR_SOURCES]},
		}
	}

	if (enabled.includes('presence')) return state

	return {...state, settings: {...settings, enabledCalendarSources: [...enabled, 'presence']}}
}

export const migrations: MigrationManifest = {
	// `MigrationManifest` types every entry as taking and returning
	// redux-persist's own opaque `PersistedState`, which cannot describe the
	// app's slices -- this cast is the one place that fiction lives.
	2: addPresenceCalendar as unknown as (state: PersistedState) => PersistedState,
}

export {addPresenceCalendar}
