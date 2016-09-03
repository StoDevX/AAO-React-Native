// @flow
import type {BusScheduleType} from './types'
import moment from 'moment-timezone'
import head from 'lodash/head'
import last from 'lodash/last'
import find from 'lodash/find'
const TIMEZONE = 'America/Winnipeg'
const TIME_FORMAT = 'h:mma'

export function getFirstTime(schedule: BusScheduleType) {
  return moment.tz(head(head(schedule.times)), TIME_FORMAT, TIMEZONE)
}

export function getLastTime(schedule: BusScheduleType) {
  return moment.tz(last(last(schedule.times)), TIME_FORMAT, TIMEZONE)
}

export default function getSetOfStopsForNow(
  schedule: BusScheduleType,
  now: typeof moment=moment.tz(TIMEZONE)
): string[]|'early'|'late' {

  let times: string[]|void = find(schedule.times, times => {
    const startTime = moment.tz(head(times), TIME_FORMAT, TIMEZONE)
    const endTime = moment.tz(last(times), TIME_FORMAT, TIMEZONE)
    return now.isBetween(startTime, endTime)
  })

  if (times) {
    return times
  }

  let firstBus = getFirstTime(schedule)
  if (now.isSameOrBefore(firstBus)) {
    return head(schedule.times)
  }

  return last(schedule.times)
}
