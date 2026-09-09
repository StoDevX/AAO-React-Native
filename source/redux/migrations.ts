import type {MigrationManifest, PersistedState} from 'redux-persist'

import type {FavoriteBuilding} from './parts/buildings'
import {DEFAULT_CALENDAR_SOURCES} from './parts/settings'

/**
 * The shape of persisted root state that these migrations actually read and
 * write. `redux-persist`'s own `PersistedState` type is deliberately opaque
 * -- it knows nothing about the app's slices -- so this describes the slices
 * the migrations care about instead.
 */
interface PersistedRootState {
	settings?: {enabledCalendarSources?: string[]; [key: string]: unknown}
	buildings?: {favorites?: Array<string> | Array<FavoriteBuilding>; [key: string]: unknown}
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

/** Distinguishes the old bare-name shape from the migrated `{campus, name}` shape. */
function isPreCampusFavorites(
	favorites: Array<string> | Array<FavoriteBuilding>,
): favorites is Array<string> {
	return typeof favorites[0] === 'string'
}

/**
 * Favourites were stored as bare building names, which five venues share across
 * the two campuses -- favouriting Carleton's Bookstore lit up St. Olaf's. They
 * are keyed by campus now.
 *
 * Every favourite persisted before this version was a St. Olaf favourite,
 * because Carleton hours had never shipped, so the conversion is unambiguous.
 */
function scopeFavoritesToCampus(
	state: PersistedRootState | undefined,
): PersistedRootState | undefined {
	let buildings = state?.buildings
	if (!state || !buildings) return state

	let favorites = buildings.favorites
	if (!favorites || favorites.length === 0 || !isPreCampusFavorites(favorites)) {
		return state
	}

	return {
		...state,
		buildings: {
			...buildings,
			favorites: favorites.map((name) => ({campus: 'stolaf' as const, name})),
		},
	}
}

export const migrations: MigrationManifest = {
	// `MigrationManifest` types every entry as taking and returning
	// redux-persist's own opaque `PersistedState`, which cannot describe the
	// app's slices -- these casts are the one place that fiction lives.
	2: addPresenceCalendar as unknown as (state: PersistedState) => PersistedState,
	3: scopeFavoritesToCampus as unknown as (state: PersistedState) => PersistedState,
}

export {addPresenceCalendar, scopeFavoritesToCampus}
