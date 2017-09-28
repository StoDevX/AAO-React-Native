// @flow
import moment from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {parseHours} from './parse-hours'

const in30 = (start, end) =>
  start
    .clone()
    .add(30, 'minutes')
    .isSameOrAfter(end)

const timeBetween = (start, end) =>
  start
    .clone()
    .seconds(0)
    .to(end)

export function getScheduleStatusAtMoment(
  schedule: SingleBuildingScheduleType,
  m: moment,
): string {
  let {open, close} = parseHours(schedule, m)

  if (m.isBefore(open) && in30(m, open)) {
    return `Opens ${timeBetween(m, open)}`
  }

  if (m.isBetween(open, close, 'minute', '[)')) {
    if (in30(m, close)) {
      return `Closes ${timeBetween(m, close)}`
    }

    return 'Open'
  }

  return 'Closed'
}
