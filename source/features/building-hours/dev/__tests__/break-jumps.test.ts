import {describe, expect, it} from '@jest/globals'
import moment from 'moment-timezone'
import type {BreakCalendarResponse} from '@frogpond/schedules'
import {breakJumps} from '../break-jumps'

const calendar: BreakCalendarResponse = {
	data: {
		timezone: 'America/Chicago',
		breaks: {
			winter: {name: 'Winter Break', start: '2026-12-23', end: '2027-01-03'},
			fall: {name: 'Fall Break', start: '2026-10-10', end: '2026-10-13'},
			easter: {name: 'Easter', date: '2027-03-28'},
		},
	},
}

describe('breakJumps', () => {
	it('lists the breaks soonest first, with their dates', () => {
		expect(breakJumps(calendar).map(({label, shows}) => [label, shows])).toEqual([
			['Fall Break', 'Oct 10 – 13'],
			['Winter Break', 'Dec 23 – Jan 3'],
			['Easter', 'Mar 28'],
		])
	})

	it('jumps to noon on the first day, campus time', () => {
		let [fall] = breakJumps(calendar)
		expect(fall?.moment().toISOString()).toBe('2026-10-10T17:00:00.000Z')
	})

	it('knows when a moment falls inside the break, by the campus date', () => {
		let [fall] = breakJumps(calendar)
		let at = (stamp: string) => moment.tz(stamp, 'America/Chicago')
		expect(fall?.includes(at('2026-10-09 23:59'))).toBe(false)
		expect(fall?.includes(at('2026-10-10 00:00'))).toBe(true)
		expect(fall?.includes(at('2026-10-13 23:59'))).toBe(true)
		expect(fall?.includes(at('2026-10-14 00:00'))).toBe(false)
		// 1 AM UTC on the 14th is still the 13th in Northfield
		expect(fall?.includes(moment.utc('2026-10-14T01:00:00Z'))).toBe(true)
	})
})
