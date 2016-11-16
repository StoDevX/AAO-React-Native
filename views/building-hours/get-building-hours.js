// @flow
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'H:mm'

import type {BuildingInfoType, BuildingHoursType} from './types'
import type momentT from 'moment'

type HourPairType = {open: momentT, close: momentT};

export function parseBuildingHours(hours: BuildingHoursType, now: momentT): HourPairType {
  let dayOfYear = now.dayOfYear()
  let [startTimeString, closeTimeString, options={nextDay: false}] = hours

  let open = moment.tz(startTimeString, TIME_FORMAT, true, CENTRAL_TZ)
  open.dayOfYear(dayOfYear)

  let close = moment.tz(closeTimeString, TIME_FORMAT, true, CENTRAL_TZ)
  close.dayOfYear(dayOfYear)

  if (options && options.nextDay) {
    close.add(1, 'day')
  }

  return {open, close}
}

export function getBuildingHours(hoursInfo: BuildingInfoType, now: momentT): false|HourPairType {
  let dayOfWeek = now.format('ddd')
  let times = hoursInfo.times.hours[dayOfWeek]

  if (!times) {
    return false
  }

  return parseBuildingHours(times, now)
}
