// @flow
import moment from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {RESULT_FORMAT} from './constants'
import {parseHours} from './parse-hours'

export function formatBuildingTimes(
  schedule: SingleBuildingScheduleType,
  m: moment,
): string {
  let {open, close} = parseHours(schedule, m)

  let openString = open.format(RESULT_FORMAT)
  let closeString = close.format(RESULT_FORMAT)

  let closesAtMidnight = close.hour() === 0 && close.minute() === 0
  closeString = closesAtMidnight ? 'Midnight' : closeString

  return `${openString} — ${closeString}`
}
