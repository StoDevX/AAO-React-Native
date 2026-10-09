// The shared jest setup reports UI-test mode, which narrows the default
// calendar list to the fixture calendar alone. This migration only ever runs
// against state persisted by a real install, so it is the production default
// list the absent-field case has to restore.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

import {createMigrate} from 'redux-persist'
import type {PersistedState} from 'redux-persist'

import {
	addCarletonCalendar,
	addPresenceCalendar,
	dropUnknownCampusFavorites,
	followBuildForDevMode,
	migrations,
	scopeFavoritesToCampus,
} from '../migrations'

test('adds Presence to a calendar list that predates it', () => {
	let migrated = addPresenceCalendar({settings: {enabledCalendarSources: ['stolaf']}})
	expect(migrated?.settings?.enabledCalendarSources).toStrictEqual(['stolaf', 'presence'])
})

test('leaves a list that already names Presence alone', () => {
	let migrated = addPresenceCalendar({settings: {enabledCalendarSources: ['presence']}})
	expect(migrated?.settings?.enabledCalendarSources).toStrictEqual(['presence'])
})

test('adds Presence even when every source had been switched off', () => {
	let migrated = addPresenceCalendar({settings: {enabledCalendarSources: []}})
	expect(migrated?.settings?.enabledCalendarSources).toStrictEqual(['presence'])
})

test('state persisted before the field existed gets the whole default list', () => {
	let migrated = addPresenceCalendar({settings: {devModeOverride: false}})
	expect(migrated?.settings?.enabledCalendarSources).toStrictEqual([
		'stolaf',
		'presence',
		'carleton',
	])
})

test('leaves the rest of the settings slice alone', () => {
	let migrated = addPresenceCalendar({settings: {devModeOverride: true}})
	expect(migrated?.settings?.devModeOverride).toBe(true)
})

test('leaves state with no settings slice alone', () => {
	expect(addPresenceCalendar({})).toStrictEqual({})
})

describe('the campus-scoped favourites migration', () => {
	// Every favourite persisted under the old, campus-less shape was a St.
	// Olaf favourite -- Carleton hours had never shipped -- so the migration
	// must not lose them, and must not guess wrong about which campus they
	// belong to.
	it('rehydrates an old bare-name payload to campus-scoped St. Olaf favourites', () => {
		let migrated = scopeFavoritesToCampus({
			buildings: {favorites: ['Bookstore', 'Registrar']},
		})

		expect(migrated?.buildings?.favorites).toStrictEqual([
			{campus: 'edu.stolaf', name: 'Bookstore'},
			{campus: 'edu.stolaf', name: 'Registrar'},
		])
	})

	it('leaves an empty favourites list alone', () => {
		let migrated = scopeFavoritesToCampus({buildings: {favorites: []}})
		expect(migrated?.buildings?.favorites).toStrictEqual([])
	})

	it('leaves an already campus-scoped payload alone', () => {
		let migrated = scopeFavoritesToCampus({
			buildings: {favorites: [{campus: 'carleton', name: 'Sayles Café'}]},
		})

		expect(migrated?.buildings?.favorites).toStrictEqual([
			{campus: 'carleton', name: 'Sayles Café'},
		])
	})

	it('leaves state with no buildings slice alone', () => {
		expect(scopeFavoritesToCampus({})).toStrictEqual({})
	})
})

// The two migrations were written on separate branches, each numbering itself
// 2. Renumbering one is the kind of edit that silently skips it: the functions
// keep passing their own tests while nothing runs them. This asserts the
// manifest, which is what redux-persist actually consults.
describe('the migration manifest', () => {
	it('runs both migrations against state persisted at version 1', async () => {
		let stored = {
			_persist: {version: 1, rehydrated: false},
			settings: {enabledCalendarSources: ['stolaf']},
			buildings: {favorites: ['Bookstore']},
		} as unknown as PersistedState

		let migrated = (await createMigrate(migrations)(stored, 3)) as unknown as {
			settings: {enabledCalendarSources: string[]}
			buildings: {favorites: Array<{campus: string; name: string}>}
		}

		expect(migrated.settings.enabledCalendarSources).toStrictEqual(['stolaf', 'presence'])
		expect(migrated.buildings.favorites).toStrictEqual([{campus: 'edu.stolaf', name: 'Bookstore'}])
	})

	it('runs only the favourites migration for an install already at version 2', async () => {
		let stored = {
			_persist: {version: 2, rehydrated: false},
			settings: {enabledCalendarSources: ['stolaf']},
			buildings: {favorites: ['Bookstore']},
		} as unknown as PersistedState

		let migrated = (await createMigrate(migrations)(stored, 3)) as unknown as {
			settings: {enabledCalendarSources: string[]}
			buildings: {favorites: Array<{campus: string; name: string}>}
		}

		// Untouched: version 2 already ran for this install.
		expect(migrated.settings.enabledCalendarSources).toStrictEqual(['stolaf'])
		expect(migrated.buildings.favorites).toStrictEqual([{campus: 'edu.stolaf', name: 'Bookstore'}])
	})
})

describe('the Carleton calendar migration', () => {
	it('adds Carleton to a stored list', () => {
		let migrated = addCarletonCalendar({settings: {enabledCalendarSources: ['stolaf']}})
		expect(migrated?.settings?.enabledCalendarSources).toStrictEqual(['stolaf', 'carleton'])
	})

	it('leaves a list that already names Carleton alone', () => {
		let state = {settings: {enabledCalendarSources: ['carleton']}}
		expect(addCarletonCalendar(state)).toBe(state)
	})

	it('leaves no stored list alone, since the defaults name Carleton', () => {
		let state = {settings: {devModeOverride: false}}
		expect(addCarletonCalendar(state)).toBe(state)
	})

	it('runs alone for an install already at version 3', async () => {
		let stored = {
			_persist: {version: 3, rehydrated: false},
			settings: {enabledCalendarSources: ['stolaf']},
		} as unknown as PersistedState

		let migrated = (await createMigrate(migrations)(stored, 4)) as unknown as {
			settings: {enabledCalendarSources: string[]}
		}

		expect(migrated.settings.enabledCalendarSources).toStrictEqual(['stolaf', 'carleton'])
	})
})

describe('the campus-id favourites migration', () => {
	it("drops a 2.9 release candidate's favourites, keyed by the old ids", () => {
		let migrated = dropUnknownCampusFavorites({
			buildings: {
				favorites: [
					{campus: 'stolaf', name: 'Bookstore'},
					{campus: 'carleton', name: 'Sayles Café'},
				],
			},
		})
		expect(migrated?.buildings?.favorites).toStrictEqual([])
	})

	it('keeps favourites that name a campus by id', () => {
		let favorites = [{campus: 'edu.carleton', name: 'Sayles Café'}]
		let migrated = dropUnknownCampusFavorites({buildings: {favorites}})
		expect(migrated?.buildings?.favorites).toStrictEqual(favorites)
	})

	it('leaves state with no buildings slice alone', () => {
		expect(dropUnknownCampusFavorites({})).toStrictEqual({})
	})
})

describe('favourites through every migration', () => {
	// An App Store install (2.8 and before) stored bare names, all St. Olaf's.
	it("keeps an App Store install's favourites, on St. Olaf", async () => {
		let stored = {
			_persist: {version: 2, rehydrated: false},
			settings: {enabledCalendarSources: ['stolaf', 'presence']},
			buildings: {favorites: ['Bookstore']},
		} as unknown as PersistedState
		let migrated = (await createMigrate(migrations)(stored, 5)) as unknown as {
			buildings: {favorites: Array<{campus: string; name: string}>}
		}
		expect(migrated.buildings.favorites).toStrictEqual([{campus: 'edu.stolaf', name: 'Bookstore'}])
	})

	it("resets a 2.9 release candidate's favourites", async () => {
		let stored = {
			_persist: {version: 4, rehydrated: false},
			settings: {enabledCalendarSources: ['stolaf', 'presence', 'carleton']},
			buildings: {favorites: [{campus: 'carleton', name: 'Sayles Café'}]},
		} as unknown as PersistedState
		let migrated = (await createMigrate(migrations)(stored, 5)) as unknown as {
			buildings: {favorites: Array<{campus: string; name: string}>}
		}
		expect(migrated.buildings.favorites).toStrictEqual([])
	})
})

describe('the dev mode toggle migration', () => {
	it('sets an untouched toggle to follow the build', () => {
		let migrated = followBuildForDevMode({settings: {devModeOverride: false}})
		expect(migrated?.settings?.devModeOverride).toBeNull()
	})

	it('keeps dev mode on where it was turned on', () => {
		let state = {settings: {devModeOverride: true}}
		expect(followBuildForDevMode(state)).toBe(state)
	})
})
