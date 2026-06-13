import moment from 'moment-timezone'
import type {UnprocessedBusLine} from '../../../transportation/bus/types'
import {selectNextDepartures} from '../select-next-departures'

// 2026-06-12 is a Friday. parseTime interprets times relative to `now`.
const line: UnprocessedBusLine = {
	line: 'Red Line',
	colors: {bar: '#f00', dot: '#f00'},
	schedules: [
		{
			days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
			coordinates: {},
			stops: ['Stav Hall'],
			times: [['9:00am'], ['1:00pm'], ['5:00pm']],
		},
	],
}

describe('selectNextDepartures', () => {
	it('returns the next upcoming departure per line', () => {
		let now = moment.tz('2026-06-12 12:00', 'America/Chicago')
		let [result] = selectNextDepartures([line], now)
		expect(result.line).toBe('Red Line')
		expect(result.stopName).toBe('Stav Hall')
		expect(result.time?.format('h:mma')).toBe('1:00pm')
	})

	it('returns a null time when no departures remain today', () => {
		let now = moment.tz('2026-06-12 18:00', 'America/Chicago')
		let [result] = selectNextDepartures([line], now)
		expect(result.time).toBeNull()
	})

	it('returns a null time when the line is not running today', () => {
		let now = moment.tz('2026-06-13 12:00', 'America/Chicago') // Saturday
		let [result] = selectNextDepartures([line], now)
		expect(result.time).toBeNull()
		expect(result.stopName).toBeNull()
	})
})
