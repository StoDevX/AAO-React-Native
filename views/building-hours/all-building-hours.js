// @flow
import map from 'lodash/map'
import type momentT from 'moment'
import type {BuildingInfoType, DayOfWeekType} from './types'
import {parseBuildingHours} from './get-building-hours'

const dayToDayMap: {[key: DayOfWeekType]: string} = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday',
}

export function allBuildingHours(info: BuildingInfoType, now: momentT) {
  return map(info.times.hours, (hourSet, day) => {
    let times = parseBuildingHours(hourSet, now)

    let hoursString
    if (times) {
      hoursString = `${times.open.format('h:mm a')} – ${times.close.format('h:mm a')}`
    } else {
      hoursString = 'Closed'
    }

    return `${dayToDayMap[day]}: ${hoursString}`
  })
}
