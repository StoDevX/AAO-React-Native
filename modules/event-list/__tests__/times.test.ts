/* eslint-env jest */

import moment from 'moment'
import {times, detailTimes} from '../times.js'

describe('allDay', () => {
	test('should be true for a midnight-to-midnight event', () => {
		const event = {
			startTime: moment('2018-08-07T00:00:00Z'),
			endTime: moment('2018-08-08T00:00:00Z'),
		}
		expect(times(event).allDay).toBe(true)
		expect(detailTimes(event).allDay).toBe(true)
	})

	test('should be true for a noon-to-noon event', () => {
		const event = {
			startTime: moment('2018-08-07T12:00:00Z'),
			endTime: moment('2018-08-08T12:00:00Z'),
		}
		expect(times(event).allDay).toBe(true)
		expect(detailTimes(event).allDay).toBe(true)
	})

	test('should be false for a non-24 hour event', () => {
		const event = {
			startTime: moment('2018-08-07T12:00:00Z'),
			endTime: moment('2018-08-07T12:30:00Z'),
		}
		expect(times(event).allDay).toBe(false)
		expect(detailTimes(event).allDay).toBe(false)
	})
})

xdescribe('ongoing events', () => {
	test('should be formatted', () => {
		const event = {
			startTime: moment().subtract(1, 'hour'),
			endTime: moment().add(1, 'hour'),
		}
		expect(times(event)).toMatchSnapshot()
		// expect(detailTimes(event)).toMatchSnapshot()
	})
})

// multi-day events

// zero-length events

// midnight and noon
// events starting at midnight
// ... ending
// starting ... noon
// ... ending

// unremarkable events

// and they can all test times and detailTimes right next to each other -
// no need for separate testcases.
