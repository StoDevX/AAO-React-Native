// @flow
import {getCurrentBusIteration} from '../get-current-bus-iteration'
import {processBusSchedule} from '../process-bus-line'
import {dayAndTime} from './moment.helper'

import type {UnprocessedBusSchedule, BusSchedule} from '../../types'

// prettier-ignore
function buildBusSchedules(now): Array<BusSchedule> {
  const schedules: Array<UnprocessedBusSchedule> = [
    {
      days: ['Mo', 'Tu'],
      coordinates: {},
      stops: ['St. Olaf', 'Carleton', 'Food Co-op', 'Cub/Target', 'El Tequila', 'Food Co-op', 'Carleton', 'St. Olaf'],
      times: [['4:15pm',  '4:22pm',   '4:23pm',     '4:33pm',     '4:37pm',     '4:43pm',     '4:44pm',   '4:52pm'],
              ['4:55pm',  '5:02pm',   '5:03pm',     '5:13pm',     '5:17pm',     '5:23pm',     '5:24pm',   '5:32pm'],
              ['5:35pm',  '5:42pm',   '5:43pm',     '5:53pm',     '5:57pm',     '6:03pm',     '6:04pm',   '6:12pm'],
      ],
    },
  ]
  return schedules.map(processBusSchedule(now))
}

test('returns the bus times index for the given time', () => {
  let now = dayAndTime('Mo 4:16pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual).toBe(0)
})

test('returns `false` if there is no bus running at the given time', () => {
  let now = dayAndTime('Mo 3:00pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual).toBe(false)
})

test('returns `false` if there is no schedule for today', () => {
  let now = dayAndTime('Su 10:01pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual).toBe(false)
})

test('returns `false` if there are no times in the schedule for today', () => {
  let now = dayAndTime('Su 10:01pm')
  let actual = getCurrentBusIteration(
    [
      {
        days: ['Su'],
        coordinates: {},
        stops: ['St. Olaf'],
        times: [[]],
        timetable: [
          {
            name: 'None',
            departures: [],
          },
        ],
      },
    ],
    now,
  )
  expect(actual).toBe(false)
})
