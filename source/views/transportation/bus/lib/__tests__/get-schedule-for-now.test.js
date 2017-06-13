// @flow
import {getScheduleForNow} from '../get-schedule-for-now'
import moment from 'moment'

import type {BusScheduleType} from '../../types'

// prettier-ignore
function buildBusSchedules(): BusScheduleType[] {
  return [
    {
      days: ['Mo', 'Tu'],
      stops: ['St. Olaf', 'Carleton', 'Food Co-op', 'Cub/Target', 'El Tequila', 'Food Co-op', 'Carleton', 'St. Olaf'],
      times: [['4:15pm',  '4:22pm',   '4:23pm',     '4:33pm',     '4:37pm',     '4:43pm',     '4:44pm',   '4:52pm'],
              ['4:55pm',  '5:02pm',   '5:03pm',     '5:13pm',     '5:17pm',     '5:23pm',     '5:24pm',   '5:32pm'],
              ['5:35pm',  '5:42pm',   '5:43pm',     '5:53pm',     '5:57pm',     '6:03pm',     '6:04pm',   '6:12pm'],
      ],
    },
    {
      days: ['We', 'Th'],
      stops: ['St. Olaf', 'Carleton', 'Food Co-op', 'Cub/Target', 'El Tequila', 'Food Co-op', 'Carleton', 'St. Olaf'],
      times: [['6:15pm',  '6:22pm',   '6:23pm',     '6:33pm',     '6:37pm',     '6:43pm',     '6:44pm',   '6:52pm'],
              ['6:55pm',  '7:02pm',   '7:03pm',     '7:13pm',     '7:17pm',     '7:23pm',     '7:24pm',   '7:32pm'],
              ['7:35pm',  '7:42pm',   '7:43pm',     '7:53pm',     '7:57pm',     '8:03pm',     '8:04pm',   '8:12pm'],
      ],
    },
    {
      days: ['Fr', 'Sa'],
      stops: ['St. Olaf', 'Carleton', 'Food Co-op', 'Cub/Target', 'El Tequila', 'Food Co-op', 'Carleton', 'St. Olaf'],
      times: [['8:15pm',  '8:22pm',   '8:23pm',     '8:33pm',     '8:37pm',     '8:43pm',     '8:44pm',   '8:52pm'],
              ['8:55pm',  '9:02pm',   '9:03pm',     '9:13pm',     '9:17pm',     '9:23pm',     '9:24pm',   '9:32pm'],
              ['9:35pm',  '9:42pm',   '9:43pm',     '9:53pm',     '9:57pm',     '10:03pm',    '10:04pm',  '10:12pm'],
      ],
    },
  ]
}

it('returns the bus schedule for today', () => {
  let now = moment('Fri 10:01', 'dddd H:mm')
  let input = buildBusSchedules()
  let actual = getScheduleForNow(input, now)
  if (!actual) {
    return
  }

  expect(actual.days).toEqual(['Fr', 'Sa'])
})

it('returns `undefined` if there is no schedule for today', () => {
  let now = moment('Sun 10:01', 'dddd H:mm')
  let input = buildBusSchedules()
  let actual = getScheduleForNow(input, now)

  expect(actual).toBeUndefined()
})
