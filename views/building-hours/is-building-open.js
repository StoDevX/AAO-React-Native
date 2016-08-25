// @flow
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'HH:mm:ss'

import type {BuildingStatusType, BuildingInfoType} from './types'

export function isBuildingOpen(hoursInfo: BuildingInfoType): BuildingStatusType {
  let dayOfWeek = moment.tz(CENTRAL_TZ).format('ddd')
  let times = hoursInfo.times.hours[dayOfWeek]
  if (!times) {
    return 'closed'
  }

  let [startTime, closeTime, options={nextDay: false}] = times
  startTime = moment.tz(startTime, TIME_FORMAT, true, CENTRAL_TZ)
  closeTime = moment.tz(closeTime, TIME_FORMAT, true, CENTRAL_TZ)
  let currentTime = moment()

  if (options.nextDay) {
    closeTime.add(1, 'day')
  }

  if (currentTime.isBetween(startTime, closeTime)) {
    if (currentTime.clone().add(30, 'min').isAfter(closeTime)) {
      return 'almostClosed'
    }
    return 'open'
  }
  return 'closed'
}
