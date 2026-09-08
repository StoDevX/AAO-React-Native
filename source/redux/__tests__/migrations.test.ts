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

test('survives state persisted before the field existed', () => {
	let migrated = addPresenceCalendar({settings: {devModeOverride: false}})
	expect(migrated?.settings?.enabledCalendarSources).toStrictEqual(['presence'])
})

test('leaves state with no settings slice alone', () => {
	expect(addPresenceCalendar({})).toStrictEqual({})
})
