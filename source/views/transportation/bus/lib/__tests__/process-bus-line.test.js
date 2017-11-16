// @flow

import {processBusSchedule} from '../process-bus-line'
import {time} from './moment.helper'

// prettier-ignore
const line = {
  line: 'Blue Line',
  colors: {bar: 'rgb(103, 153, 170)', dot: 'rgb(13, 26, 35)'},
  schedules: [
    {
      days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
      coordinates: {
        'City Hall on Washington': [44.451472, -93.158529],
        'Econo Foods': [44.453983, -93.159477],
      },
      stops: [
        'City Hall on Washington',
        'Econo Foods',
      ],
      times: [
        ['6:00am', '6:01am'],
        ['6:45am', '6:46am'],
        ['7:30am', '7:31am'],
      ],
    },
  ],
}

test('processBusSchedule returns a timetable property', () => {
  let actual = processBusSchedule(time('12:00pm'))(line.schedules[0])
  expect('timetable' in actual).toBe(true)
})
