// @flow

import type moment from 'moment'
import find from 'lodash/find'
import findLast from 'lodash/findLast'
import type {BusSchedule} from '../types'
import {getScheduleForNow} from './get-schedule-for-now'

const isTruthy = x => x

export function getCurrentBusIteration(
  schedules: Array<BusSchedule>,
  now: moment,
): number | false {
  const schedule = getScheduleForNow(schedules, now)

  const index = schedule.times.findIndex(stopTimes => {
    const first = find(stopTimes, isTruthy)
    const last = findLast(stopTimes, isTruthy)

    if (!first || !last) {
      return false
    }

    if (now.isBetween(first, last)) {
      return true
    }

    return false
  })

  if (index !== -1) {
    return index
  }

  return false
}
