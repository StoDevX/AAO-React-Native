// @flow
import type {BusScheduleType} from './types'
import moment from 'moment-timezone'
import head from 'lodash/head'
import last from 'lodash/last'
import find from 'lodash/find'
const TIMEZONE = 'America/Winnipeg'

export default function getSetOfStopsForNow(
  schedule: BusScheduleType,
  now: typeof moment=moment.tz(TIMEZONE)
): (typeof moment)[] {
  let times: string[]|void = find(schedule.times, times => {
    const startTime = head(times)
    const endTime = last(times)
    return now.isBetween(startTime, endTime)
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
