import {describe, expect, it} from '@jest/globals'
import moment from 'moment-timezone'
import {formatDeparture} from '../times'

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
