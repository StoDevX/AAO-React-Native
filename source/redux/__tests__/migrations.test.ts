import {migrations} from '../migrations'

/**
 * `PersistedState` is a deliberately opaque library type -- it knows nothing
 * about the `settings` slice. Reinterpreting the migration through the shape
 * it actually reads and writes lets these tests inspect that shape directly.
 */
type CalendarState = {settings: {enabledCalendarSources: string[]}}

let migrate = migrations[2] as unknown as (state: object) => CalendarState

test('adds Presence to a calendar list that predates it', () => {
	let migrated = migrate({settings: {enabledCalendarSources: ['stolaf']}})
	expect(migrated.settings.enabledCalendarSources).toStrictEqual(['stolaf', 'presence'])
})

test('leaves a list that already names Presence alone', () => {
	let migrated = migrate({settings: {enabledCalendarSources: ['presence']}})
	expect(migrated.settings.enabledCalendarSources).toStrictEqual(['presence'])
})

test('adds Presence even when every source had been switched off', () => {
	let migrated = migrate({settings: {enabledCalendarSources: []}})
	expect(migrated.settings.enabledCalendarSources).toStrictEqual(['presence'])
})

test('survives state persisted before the field existed', () => {
	let migrated = migrate({settings: {devModeOverride: false}})
	expect(migrated.settings.enabledCalendarSources).toStrictEqual(['presence'])
})

test('leaves state with no settings slice alone', () => {
	expect(migrate({})).toStrictEqual({})
})
