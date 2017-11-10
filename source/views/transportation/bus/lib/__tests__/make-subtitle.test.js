// @flow

import {makeSubtitle} from '../make-subtitle'
import {parseTime} from '../parse-time'
import {time} from './moment.helper'

const getTimes = now =>
  [
    '4:15pm',
    '4:22pm',
    '4:23pm',
    '4:33pm',
    '4:37pm',
    '4:43pm',
    '4:44pm',
    '4:52pm',
  ].map(parseTime(now))

test('returns "running" when the bus is running', () => {
  let now = time('4:30pm')
  let actual = makeSubtitle({now, stopTimes: getTimes(now), isLastBus: false})

  expect(actual).toEqual('Running')
})

test('returns "not running" when the bus has no stops', () => {
  let now = time('4:30pm')
  let actual = makeSubtitle({now, stopTimes: [], isLastBus: false})

  expect(actual).toEqual('Not running today')
})

test('handles "now" being before the first bus', () => {
  let now = time('1:00pm')
  let actual = makeSubtitle({now, stopTimes: getTimes(now), isLastBus: false})

  expect(actual).toEqual('Starts in 3 hours')
})

test('handles "now" being after the last bus', () => {
  let now = time('5:00pm')
  let actual = makeSubtitle({now, stopTimes: getTimes(now), isLastBus: false})

  expect(actual).toEqual('Over for Today')
})

test('returns "last bus" during the last bus round', () => {
  let now = time('4:52pm')
  let actual = makeSubtitle({now, stopTimes: getTimes(now), isLastBus: true})

  expect(actual).toEqual('Last Bus')
})
