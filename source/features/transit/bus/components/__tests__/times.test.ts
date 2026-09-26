import {describe, expect, it} from '@jest/globals'
import moment from 'moment-timezone'
import {formatDeparture, formatDepartures} from '../times'

describe('formatDeparture', () => {
	it('formats a valid time', () => {
		let time = moment.tz('2026-08-20 15:00', 'America/Chicago')
		expect(formatDeparture(time)).toBe('3 PM')
	})

	it('shows a dash for a trip that skips the stop', () => {
		expect(formatDeparture(null)).toBe('—')
	})

	it('shows a dash for an Invalid Moment rather than throwing', () => {
		// A strict-mode parse of malformed feed data returns an Invalid
		// Moment, not null -- it's still a truthy object, so a bare `time ?`
		// check does not catch it, and Intl throws formatting an Invalid
		// Date where moment's own .format() never did.
		let invalid = moment.tz('garbage', 'h:mma', true, 'America/Chicago')
		expect(() => formatDeparture(invalid)).not.toThrow()
		expect(formatDeparture(invalid)).toBe('—')
	})
})

describe('formatDepartures', () => {
	let at = (hhmm: string) => moment.tz(`2026-08-20 ${hhmm}`, 'America/Chicago')

	it('leaves out trips that skip the stop before taking the first few', () => {
		let times = [at('13:00'), null, at('14:00'), null, at('15:00'), at('16:00')]

		expect(formatDepartures(times, 3)).toBe(
			[at('13:00'), at('14:00'), at('15:00')].map(formatDeparture).join(' • '),
		)
	})

	it('leaves out an Invalid Moment the same as a skip', () => {
		let invalid = moment.tz('garbage', 'h:mma', true, 'America/Chicago')

		expect(formatDepartures([invalid, at('13:00')], 3)).toBe(formatDeparture(at('13:00')))
	})

	it('shows a dash when every remaining trip skips the stop', () => {
		expect(formatDepartures([null, null], 3)).toBe('—')
	})
})
