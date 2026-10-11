import {describe, expect, it} from '@jest/globals'
import type {BreakCalendarResponse} from '@frogpond/schedules'
import type {BuildingType, NamedBuildingScheduleType} from '../../types'
import {activeBreaks, hasBreakSchedules, withBreakInEffect} from '../break-in-effect'

const calendar: BreakCalendarResponse = {
	data: {
		timezone: 'America/Chicago',
		breaks: {
			fall: {name: 'Fall Break', start: '2026-10-10', end: '2026-10-13'},
			spring: {name: 'Spring Break', start: '2027-03-20', end: '2027-03-28'},
			easter: {name: 'Easter', date: '2027-03-28'},
		},
	},
}

const usual: NamedBuildingScheduleType[] = [
	{title: 'Hours', hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:45am', to: '12:00am'}]},
]
const closed = (title: string) => ({
	schedule: [{title, isPhysicallyOpen: false, hours: []}],
	exceptions: [],
})

const library: BuildingType<unknown> = {
	name: 'Rølvaag Library',
	category: 'Libraries',
	schedule: usual,
	exceptions: [],
	breakSchedule: {fall: closed('Fall Break'), easter: closed('Easter'), spring: closed('Spring')},
}
const office: BuildingType<unknown> = {
	name: 'Registrar',
	category: 'Offices',
	schedule: usual,
	breakSchedule: {spring: closed('Spring')},
}

describe('activeBreaks', () => {
	it('starts and ends a break at campus midnight', () => {
		// 11:59 PM on Oct 9 in Northfield, then midnight
		expect(activeBreaks(calendar, Date.parse('2026-10-10T04:59:00Z'))).toEqual([])
		expect(activeBreaks(calendar, Date.parse('2026-10-10T05:00:00Z'))).toEqual(['fall'])
		expect(activeBreaks(calendar, Date.parse('2026-10-14T04:59:00Z'))).toEqual(['fall'])
		expect(activeBreaks(calendar, Date.parse('2026-10-14T05:00:00Z'))).toEqual([])
	})

	it('puts a one-day break ahead of the longer break around it', () => {
		expect(activeBreaks(calendar, Date.parse('2027-03-28T17:00:00Z'))).toEqual(['easter', 'spring'])
	})
})

describe('withBreakInEffect', () => {
	it("shows a venue's break schedule as its schedule during the break", () => {
		let [rolvaag] = withBreakInEffect([library], calendar, Date.parse('2026-10-10T23:00:00Z'))
		expect(rolvaag?.schedule).toEqual(closed('Fall Break').schedule)
		expect(rolvaag?.breakSchedule).toEqual(library.breakSchedule)
	})

	it('leaves venues alone outside a break, or without a schedule for it', () => {
		let fall = Date.parse('2026-10-11T17:00:00Z')
		expect(withBreakInEffect([office], calendar, fall)[0]).toBe(office)
		let buildings = [library, office]
		expect(withBreakInEffect(buildings, calendar, Date.parse('2026-11-02T17:00:00Z'))).toBe(
			buildings,
		)
		expect(withBreakInEffect(buildings, undefined, fall)).toBe(buildings)
	})

	it('prefers the shorter of two overlapping breaks', () => {
		let easter = Date.parse('2027-03-28T17:00:00Z')
		let [rolvaag, registrar] = withBreakInEffect([library, office], calendar, easter)
		expect(rolvaag?.schedule).toEqual(closed('Easter').schedule)
		expect(registrar?.schedule).toEqual(closed('Spring').schedule)
	})

	it('ignores break schedules in the old array shape', () => {
		let legacy = {...library, breakSchedule: {fall: closed('Fall Break').schedule}}
		expect(hasBreakSchedules([legacy])).toBe(false)
		let fall = Date.parse('2026-10-11T17:00:00Z')
		expect(withBreakInEffect([legacy], calendar, fall)[0]).toBe(legacy)
	})
})
