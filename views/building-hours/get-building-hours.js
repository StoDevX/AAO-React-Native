// @flow
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'H:mm:ss'

import type {BuildingInfoType} from './types'

export function getBuildingHours(hoursInfo: BuildingInfoType): false|{open: typeof moment, close: typeof moment, current: typeof moment} {
  let dayOfWeek = moment.tz(CENTRAL_TZ).format('ddd')
  let times = hoursInfo.times.hours[dayOfWeek]
  if (!times) {
    return false
  }

  let current = moment.tz(CENTRAL_TZ)
  let dayOfYear = current.dayOfYear()

  let [startTimeString, closeTimeString, options={nextDay: false}] = times

  let open = moment.tz(startTimeString, TIME_FORMAT, true, CENTRAL_TZ)
  open.dayOfYear(dayOfYear)

  let close = moment.tz(closeTimeString, TIME_FORMAT, true, CENTRAL_TZ)
  close.dayOfYear(dayOfYear)

  if (options.nextDay) {
    close.add(1, 'day')
  }

  return {open, close, current}
}
