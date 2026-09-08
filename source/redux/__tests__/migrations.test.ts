// The shared jest setup reports UI-test mode, which narrows the default
// calendar list to the fixture calendar alone. This migration only ever runs
// against state persisted by a real install, so it is the production default
// list the absent-field case has to restore.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

import {addPresenceCalendar} from '../migrations'

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
