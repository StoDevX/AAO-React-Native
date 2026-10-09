import type {MigrationManifest, PersistedState} from 'redux-persist'

import {isCampusId} from '../campuses'
import {DEFAULT_CALENDAR_SOURCES} from './parts/settings'

/** A favourite as any version stored it: `campus` is whatever id that version used. */
type StoredFavorite = {campus: string; name: string}

/**
 * The shape of persisted root state that these migrations actually read and
 * write. `redux-persist`'s own `PersistedState` type is deliberately opaque
 * -- it knows nothing about the app's slices -- so this describes the slices
 * the migrations care about instead.
 */
interface PersistedRootState {
	settings?: {enabledCalendarSources?: string[]; [key: string]: unknown}
	buildings?: {favorites?: Array<string> | Array<StoredFavorite>; [key: string]: unknown}
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

/** Distinguishes the old bare-name shape from the campus-scoped shape. */
function isPreCampusFavorites(
	favorites: Array<string> | Array<StoredFavorite>,
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
 * It names St. Olaf by its campus id, so the App Store installs this reaches
 * keep their favourites through migration 5.
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
			favorites: favorites.map((name) => ({campus: 'edu.stolaf', name})),
		},
	}
}

/**
 * Carleton's calendar is on by default, and as with Presence that has to mean
 * everyone, not only fresh installs. A St. Olaf install never shows it, so
 * adding it there changes nothing until the campus is switched.
 */
function addCarletonCalendar(
	state: PersistedRootState | undefined,
): PersistedRootState | undefined {
	let settings = state?.settings
	if (!state || !settings) return state

	let enabled = settings.enabledCalendarSources
	// No stored list still reads the defaults, which name Carleton.
	if (!enabled || enabled.includes('carleton')) return state

	return {...state, settings: {...settings, enabledCalendarSources: [...enabled, 'carleton']}}
}

/**
 * The 2.9 betas and release candidates keyed favourites by `stolaf` and
 * `carleton`, which name no campus now. Those favourites are dropped rather
 * than carried over: only TestFlight builds ever wrote them. A favourite
 * migration 3 wrote for an App Store install already names its campus by id,
 * and stays.
 */
function dropUnknownCampusFavorites(
	state: PersistedRootState | undefined,
): PersistedRootState | undefined {
	let buildings = state?.buildings
	if (!state || !buildings?.favorites) return state

	let stored: Array<string | StoredFavorite> = buildings.favorites
	let favorites = stored.filter(
		(favorite): favorite is StoredFavorite =>
			typeof favorite !== 'string' && isCampusId(favorite.campus),
	)
	return {...state, buildings: {...buildings, favorites}}
}

/**
 * The dev mode toggle could only turn dev mode on, so a stored `false` meant
 * "follow the build", whether or not it was ever touched. It means "off" now,
 * which would hide dev mode in every debug build that had stored it, so it
 * goes back to following the build. A stored `true` still means on.
 */
function followBuildForDevMode(
	state: PersistedRootState | undefined,
): PersistedRootState | undefined {
	let settings = state?.settings
	if (!state || !settings || settings.devModeOverride !== false) return state

	return {...state, settings: {...settings, devModeOverride: null}}
}

export const migrations: MigrationManifest = {
	// `MigrationManifest` types every entry as taking and returning
	// redux-persist's own opaque `PersistedState`, which cannot describe the
	// app's slices -- these casts are the one place that fiction lives.
	2: addPresenceCalendar as unknown as (state: PersistedState) => PersistedState,
	3: scopeFavoritesToCampus as unknown as (state: PersistedState) => PersistedState,
	4: addCarletonCalendar as unknown as (state: PersistedState) => PersistedState,
	5: dropUnknownCampusFavorites as unknown as (state: PersistedState) => PersistedState,
	6: followBuildForDevMode as unknown as (state: PersistedState) => PersistedState,
}

export {
	addCarletonCalendar,
	addPresenceCalendar,
	dropUnknownCampusFavorites,
	followBuildForDevMode,
	scopeFavoritesToCampus,
}
