import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'

import {findCafeMessage} from '../cafe-message'
import type {BonAppCafeDay, EditedBonAppCafeInfoType} from '../../types'

const CAMPUS = 'America/Chicago'
const TODAY = moment.tz('2026-09-20 12:00', CAMPUS)

function cafe(...days: Partial<BonAppCafeDay>[]): EditedBonAppCafeInfoType {
	return {
		cafe: {
			days: days.map((day) => ({
				date: '2026-09-20',
				dayparts: [],
				status: '',
				message: false,
				...day,
			})),
		},
	} as EditedBonAppCafeInfoType
}

const serving = [{id: '1', starttime: '09:00', endtime: '10:30', message: '', label: 'Breakfast'}]

describe('findCafeMessage', () => {
	test('says nothing about a cafe that is serving today', () => {
		expect(findCafeMessage(cafe({dayparts: serving}), TODAY)).toBeNull()
	})

	// Weitz on a Sunday. ccc-server answers a cafe whose Bon Appétit page
	// carries no menu with `CustomCafe()`, which is the one thing that
	// produces an empty `dayparts`, and it puts the reason beside it.
	test("reads a day with no dayparts as closed, and passes on the cafe's reason", () => {
		expect(findCafeMessage(cafe({message: 'Café is closed'}), TODAY)).toBe('Café is closed')
	})

	// `message` defaults to `false` rather than to empty, which is not a
	// sentence to put on the screen.
	test('falls back when the cafe gives no reason', () => {
		expect(findCafeMessage(cafe({}), TODAY)).toBe('Closed today')
	})

	// The contract names `closed` as a value of `status`, though nothing in
	// ccc-server assigns it today -- every response takes the schema's `''`
	// default. A server that starts setting it is still telling us it is shut.
	test("honours the contract's closed flag even on a day with dayparts", () => {
		let shut = cafe({status: 'closed', message: 'Closed for Christmas Break', dayparts: serving})
		expect(findCafeMessage(shut, TODAY)).toBe('Closed for Christmas Break')
	})

	test('says nothing about a standing message on a day that is being served', () => {
		let open = cafe({message: 'Grill closes early', dayparts: serving})
		expect(findCafeMessage(open, TODAY)).toBeNull()
	})

	test('reads a cafe with no entry for today as closed', () => {
		expect(findCafeMessage(cafe({date: '2026-09-21', dayparts: serving}), TODAY)).toBe(
			'Closed today',
		)
	})
})
