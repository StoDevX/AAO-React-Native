// @flow
import type {BusScheduleType} from './types'
import moment from 'moment-timezone'
import head from 'lodash/head'
import last from 'lodash/last'
import find from 'lodash/find'

export default function getSetOfStopsForNow(
  schedule: BusScheduleType,
  now: typeof moment
): (typeof moment)[] {
  let times: string[]|void = find(schedule.times, times => {
    const startTime = head(times)
    const endTime = last(times)
    // Momentjs inclusivity: A [ indicates inclusion of a value. A ( indicates
    // exclusion. If the inclusivity parameter is used, both indicators must
    // be passed.
    return now.isBetween(startTime, endTime, null, '[]')
  })

  if (times) {
    return times
  }

  let firstBus = head(head(schedule.times))
  if (now.isSameOrBefore(firstBus)) {
    return head(schedule.times)
  }

  return last(schedule.times)
}
