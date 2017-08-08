/* eslint-env jest */

import moment from 'moment'
import {times, detailTimes} from '../times.js'

describe('allDay', () => {
  test('should be true for a midnight-to-midnight event', () => {
    const event = {startTime: moment('2017-08-07 12:00am'), endTime: moment('2017-08-08 12:00am')}
    expect(times(event).allDay).toBe(true)
    expect(detailTimes(event).allDay).toBe(true)
  })
  // should be true for a noon-to-noon event
  // should be false for a non-24 hour event
})

// describe: ongoing events
// test: should be formatted
// expect().toMatchSnapshot

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
