// @flow
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'H:mm:ss'
const RESULT_FORMAT = 'h:mma'

import {isBuildingOpen} from './is-building-open'
import type {BuildingInfoType} from './types'

export function getBuildingHours(hoursInfo: BuildingInfoType): string {
  let dayOfWeek = moment.tz(CENTRAL_TZ).format('ddd')
  let times = hoursInfo.times.hours[dayOfWeek]
  if (!times) {
    return 'Closed today'
  }

  let [startTimeString, closeTimeString, options={nextDay: false}] = times
  let startTime = moment.tz(startTimeString, TIME_FORMAT, true, CENTRAL_TZ)
  let closeTime = moment.tz(closeTimeString, TIME_FORMAT, true, CENTRAL_TZ)

  if (options.nextDay) {
    closeTime.add(1, 'day')
  }

  let isOpen = isBuildingOpen(hoursInfo)

  let openString = startTime.format(RESULT_FORMAT)
  let closeString = closeTime.format(RESULT_FORMAT)

  let hourState = `${openString} / ${closeString}`
  if (isOpen === 'open') {
    return `Open – ${hourState}`
  } else if (isOpen === 'closed') {
    return `${hourState} – Closed`
  } else if (isOpen === 'almostClosed') {
    return `${hourState} – Almost Closed`
  }

  return 'Closed today'
}
