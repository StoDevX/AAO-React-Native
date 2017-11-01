// @flow
import {makeSubtitle} from '../make-subtitle'
import {parseTime} from '../parse-time'
import moment from 'moment'

const getTimes = () =>
  [
    '4:15pm',
    '4:22pm',
    '4:23pm',
    '4:33pm',
    '4:37pm',
    '4:43pm',
    '4:44pm',
    '4:52pm',
  ].map(parseTime)

it('handles "now" being before the first bus', () => {
  let now = moment('13:00pm', 'hh:mma')
  console.log(now)
  let actual = makeSubtitle({now, moments: getTimes(), isLastBus: false})

  expect(actual).toEqual('Starts in 1')
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
