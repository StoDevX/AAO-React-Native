// @flow
import {getCurrentBusIteration} from '../get-current-bus-iteration'
import {processBusSchedule} from '../process-bus-line'
import {dayAndTime, time} from './moment.helper'

import type {UnprocessedBusSchedule, BusSchedule} from '../../types'

function buildBusSchedules(now): BusSchedule {
  // prettier-ignore
  const schedules: UnprocessedBusSchedule = {
    days: ['Mo', 'Tu'],
    coordinates: {},
    stops: ['St. Olaf', 'Carleton', 'Food Co-op', 'Cub/Target', 'El Tequila', 'Food Co-op', 'Carleton', 'St. Olaf'],
    times: [['1:00pm',  '1:05pm',   '1:10pm',     '1:15pm',     '1:20pm',     '1:25pm',     '1:30pm',   '1:35pm'],
            ['2:00pm',  '2:05pm',   '2:10pm',     '2:15pm',     '2:20pm',     '2:25pm',     '2:30pm',   '2:35pm'],
            ['3:00pm',  '3:05pm',   '3:10pm',     '3:15pm',     '3:20pm',     '3:25pm',     '3:30pm',   '3:35pm'],
    ],
  }
  return processBusSchedule(now)(schedules)
}

test('returns the bus times index for the given time', () => {
  let now = time('1:00pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual.status).toBe('running')
  expect(actual.index).toBe(0)
})

test('returns the bus times index for the given time', () => {
  let now = time('2:05pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual.status).toBe('running')
  expect(actual.index).toBe(1)
})

test('handles the given time being after the last bus', () => {
  let now = time('5:00pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual.status).toBe('after-end')
  expect(actual.index).toBe(null)
})

test('handles the given time being before the first bus', () => {
  let now = time('12:00pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual.status).toBe('before-start')
  expect(actual.index).toBe(null)
})

test('ignores day-of-week', () => {
  let now = dayAndTime('Mo 1:00pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual.status).toBe('running')
  expect(actual.index).toBe(0)
})

test('handles a schedule with no times', () => {
  let now = time('1:00pm')
  let schedule = {
    days: ['Su'],
    coordinates: {},
    stops: [],
    times: [[]],
  }
  let input = processBusSchedule(now)(schedule)
  let actual = getCurrentBusIteration(input, now)
  expect(actual.status).toBe('none')
  expect(actual.index).toBe(null)
})

test('handles the given time being between two iterations', () => {
  let now = time('1:55pm')
  let input = buildBusSchedules(now)
  let actual = getCurrentBusIteration(input, now)
  expect(actual.status).toBe('between-rounds')
  expect(actual.index).toBe(1)
})
