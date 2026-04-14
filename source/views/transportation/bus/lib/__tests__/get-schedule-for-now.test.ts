import {expect, test} from '@jest/globals'
import {Temporal} from 'temporal-polyfill'
import {getScheduleForNow} from '../get-schedule-for-now'
import {processBusSchedule} from '../process-bus-line'
import type {BusSchedule, UnprocessedBusSchedule} from '../../types'

// prettier-ignore
function buildBusSchedules(now: Temporal.ZonedDateTime): Array<BusSchedule> {
  const schedules: Array<UnprocessedBusSchedule> = [
    {
      days: ['Fr', 'Sa'],
      coordinates: {},
      stops: ['St. Olaf', 'Carleton', 'Food Co-op', 'Cub/Target', 'El Tequila', 'Food Co-op', 'Carleton', 'St. Olaf'],
      times: [['8:15pm',  '8:22pm',   '8:23pm',     '8:33pm',     '8:37pm',     '8:43pm',     '8:44pm',   '8:52pm'],
              ['8:55pm',  '9:02pm',   '9:03pm',     '9:13pm',     '9:17pm',     '9:23pm',     '9:24pm',   '9:32pm'],
              ['9:35pm',  '9:42pm',   '9:43pm',     '9:53pm',     '9:57pm',     '10:03pm',    '10:04pm',  '10:12pm'],
      ],
    },
  ]
  return schedules.map(processBusSchedule(now))
}

test('returns the bus schedule for today', () => {
	// a saturday (2017-11-18T13:14:00-06:00 = CST)
	let now = Temporal.Instant.from(
		'2017-11-18T13:14:00-06:00',
	).toZonedDateTimeISO('America/Chicago')
	let input = buildBusSchedules(now)
	let actual = getScheduleForNow(input, now)

	expect(actual).toMatchSnapshot()
})

test('returns an empty schedule if there is no schedule for today', () => {
	// a sunday (2017-11-12T13:14:00Z = UTC Sunday)
	let now = Temporal.Instant.from('2017-11-12T13:14:00Z').toZonedDateTimeISO(
		'America/Chicago',
	)
	let input = buildBusSchedules(now)
	let actual = getScheduleForNow(input, now)

	expect(actual).toMatchSnapshot()
})
