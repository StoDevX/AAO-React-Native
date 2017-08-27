// @flow
import moment from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {RESULT_FORMAT} from './constants'
import {parseHours} from './parse-hours'

function formatSingleTime(time: moment): string {
  if (time.hour() === 0 && time.minute() === 0) {
    return 'Midnight'
  }
  if (time.hour() === 12 && time.minute() === 0) {
    return 'Noon'
  }
  return time.format(RESULT_FORMAT)
}

export function formatBuildingTimes(
  schedule: SingleBuildingScheduleType,
  m: moment,
): string {
  const {open, close} = parseHours(schedule, m)
  return `${formatSingleTime(open)} — ${formatSingleTime(close)}`
}
