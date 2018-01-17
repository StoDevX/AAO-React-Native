// @flow
import {getScheduleForNow} from '../get-schedule-for-now'
import {processBusSchedule} from '../process-bus-line'
import moment from 'moment'

import type {UnprocessedBusSchedule, BusSchedule} from '../../types'

// prettier-ignore
function buildBusSchedules(now): Array<BusSchedule> {
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
	// a saturday
	let now = moment.utc('2017-11-18T13:14:00.000-06:00', moment.ISO_8601)
	let input = buildBusSchedules(now)
	let actual = getScheduleForNow(input, now)

	expect(actual).toMatchSnapshot()
})

test('returns an empty schedule if there is no schedule for today', () => {
	// a sunday
	let now = moment.utc('2017-11-12T13:14:00.000Z', moment.ISO_8601)
	let input = buildBusSchedules(now)
	let actual = getScheduleForNow(input, now)

	expect(actual).toMatchSnapshot()
})
