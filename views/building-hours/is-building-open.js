// @flow
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'H:mm:ss'

import type {BuildingStatusType, BuildingInfoType} from './types'

export function isBuildingOpen(hoursInfo: BuildingInfoType): BuildingStatusType {
  let dayOfWeek = moment.tz(CENTRAL_TZ).format('ddd')
  let times = hoursInfo.times.hours[dayOfWeek]
  if (!times) {
    return 'closed'
  }

  let [startTimeString, closeTimeString, options={nextDay: false}] = times
  let startTime = moment.tz(startTimeString, TIME_FORMAT, true, CENTRAL_TZ)
  let closeTime = moment.tz(closeTimeString, TIME_FORMAT, true, CENTRAL_TZ)

  if (options.nextDay) {
    closeTime.add(1, 'day')
  }

  let currentTime = moment.tz(CENTRAL_TZ)
  if (currentTime.isBetween(startTime, closeTime)) {
    if (currentTime.clone().add(30, 'min').isAfter(closeTime)) {
      return 'almostClosed'
    }
    return 'open'
  }
  return 'closed'
}
