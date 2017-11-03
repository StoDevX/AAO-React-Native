// @flow

import {makeSubtitle} from '../make-subtitle'
import {parseTime} from '../parse-time'
import moment from 'moment'

const getTimes = (now: moment) =>
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
  let now = moment('4:30pm', 'h:mma')
  let actual = makeSubtitle({now, stopTimes: getTimes(now), isLastBus: false})

  expect(actual).toEqual('Running')
})

test('returns "not running" when the bus has no stops', () => {
  let now = moment('4:30pm', 'h:mma')
  let actual = makeSubtitle({now, stopTimes: [], isLastBus: false})

  expect(actual).toEqual('Not running today')
})

test('handles "now" being before the first bus', () => {
  let now = moment('1:00pm', 'h:mma')
  let actual = makeSubtitle({now, stopTimes: getTimes(now), isLastBus: false})

  expect(actual).toEqual('Starts in 3 hours')
})

test('handles "now" being after the last bus', () => {
  let now = moment('5:00pm', 'h:mma')
  let actual = makeSubtitle({now, stopTimes: getTimes(now), isLastBus: false})

  expect(actual).toEqual('Over for Today')
})

test('returns "last bus" during the last bus round', () => {
  let now = moment('4:52pm', 'h:mma')
  let actual = makeSubtitle({now, stopTimes: getTimes(now), isLastBus: true})

  expect(actual).toEqual('Last Bus')
})
