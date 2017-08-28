// @flow
import moment from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {parseHours} from './parse-hours'

export function getScheduleStatusAtMoment(
  schedule: SingleBuildingScheduleType,
  m: moment,
): string {
  let {open, close} = parseHours(schedule, m)

  if (
    m.isBefore(open) &&
    m
      .clone()
      .add(30, 'minutes')
      .isSameOrAfter(open)
  ) {
    return `Opens ${m
      .clone()
      .seconds(0)
      .to(open)}`
  }
  if (m.isBetween(open, close, 'minute', '[)')) {
    if (
      m
        .clone()
        .add(30, 'minutes')
        .isSameOrAfter(close)
    ) {
      return `Closes ${m
        .clone()
        .seconds(0)
        .to(close)}`
    }
    return 'Open'
  }
  return 'Closed'
}
