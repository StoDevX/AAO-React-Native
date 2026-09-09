// The shared jest setup reports UI-test mode, which narrows the default
// calendar list to the fixture calendar alone. This migration only ever runs
// against state persisted by a real install, so it is the production default
// list the absent-field case has to restore.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

import {createMigrate} from 'redux-persist'
import type {PersistedState} from 'redux-persist'

import {addPresenceCalendar, migrations, scopeFavoritesToCampus} from '../migrations'

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
	expect(migrated?.settings?.enabledCalendarSources).toStrictEqual(['stolaf', 'presence'])
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
			{campus: 'stolaf', name: 'Bookstore'},
			{campus: 'stolaf', name: 'Registrar'},
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
		expect(migrated.buildings.favorites).toStrictEqual([{campus: 'stolaf', name: 'Bookstore'}])
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
		expect(migrated.buildings.favorites).toStrictEqual([{campus: 'stolaf', name: 'Bookstore'}])
	})
})
