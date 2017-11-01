// @flow
import {getSetOfStopsForNow} from '../get-set-of-stops-for-now'
import moment from 'moment'

import type {BusScheduleType} from '../../types'

// prettier-ignore
function makeSchedule(): BusScheduleType {
  return {
    days: ['Mo', 'Tu'],
    stops: ['St. Olaf', 'Carleton', 'Food Co-op', 'Cub/Target', 'El Tequila', 'Food Co-op', 'Carleton', 'St. Olaf'],
    times: [['4:15pm',  '4:22pm',   '4:23pm',     '4:33pm',     '4:37pm',     '4:43pm',     '4:44pm',   '4:52pm'],
            ['4:55pm',  '5:02pm',   '5:03pm',     '5:13pm',     '5:17pm',     '5:23pm',     '5:24pm',   '5:32pm'],
            ['5:35pm',  '5:42pm',   '5:43pm',     '5:53pm',     '5:57pm',     '6:03pm',     '6:04pm',   '6:12pm'],
    ],
  }
}

it('returns the schedule for the given time', () => {
  let now = moment('Mon 16:57', 'dddd H:mm')
  let input = makeSchedule().times
  let actual = getSetOfStopsForNow(input, now)

  expect(actual).toEqual([
    '4:55pm',
    '5:02pm',
    '5:03pm',
    '5:13pm',
    '5:17pm',
    '5:23pm',
    '5:24pm',
    '5:32pm',
  ])
})

xit('returns the first schedule if the current time is before the first loop', () => {
  let now = moment('Mon 12:00', 'dddd H:mm')
  let input = makeSchedule()
  // $FlowExpectedError
  let actual = getSetOfStopsForNow(input, now)

  expect(actual).toEqual([
    '4:15pm',
    '4:22pm',
    '4:23pm',
    '4:33pm',
    '4:37pm',
    '4:43pm',
    '4:44pm',
    '4:52pm',
  ])
})

xit('returns the last schedule if the current time is after the last loop', () => {
  let now = moment('Mon 23:30', 'dddd H:mm')
  let input = makeSchedule()
  // $FlowExpectedError
  let actual = getSetOfStopsForNow(input, now)

  expect(actual).toEqual([
    '5:35pm',
    '5:42pm',
    '5:43pm',
    '5:53pm',
    '5:57pm',
    '6:03pm',
    '6:04pm',
    '6:12pm',
  ])
})
