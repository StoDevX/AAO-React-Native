import {expect, jest, test} from '@jest/globals'

import bundled from '@frogpond/data-sources/bundled.json'
import {REL_CALENDAR} from '@frogpond/data-sources'
import {CALENDAR_TYPES} from '../query'

// `query.ts` reaches EventKit, which is not needed to read the list of media
// types it can parse.
// `source/database/client.ts` reaches `expo-sqlite`, a native module Jest
// cannot load at all.
jest.mock('expo-calendar', () => ({EntityTypes: {EVENT: 'event'}}))
jest.mock('../../../source/database/client', () => ({getRunner: jest.fn()}))

// The media type each calendar is published under lives in `data/sources.yaml`,
// and the parser keyed by it lives in `query.ts`. Nothing binds the two, so a
// type renamed on one side and not the other throws only when a student opens
// the calendar. Every bundled calendar at once, so a fifth source added without
// a parser fails here rather than in the field.
test('every bundled calendar names a media type this build can parse', () => {
	let calendars = bundled.links.filter((link) => link.rel === REL_CALENDAR)
	let unparseable = calendars
		.filter((link) => !CALENDAR_TYPES.includes(link.type))
		.map((link) => `${link.properties['https://frogpond.tech/ns/id']}: ${link.type}`)

	// Guards the check below against a rel that matches nothing at all.
	expect(calendars.length).toBeGreaterThan(0)
	expect(unparseable).toStrictEqual([])
})
