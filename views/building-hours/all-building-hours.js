import React from 'react'
import {
  Text,
} from 'react-native'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

export function allBuildingHours(info, style) {
  let dayTimes = []
  let current = moment().tz(CENTRAL_TZ)
  for (let i = 0; i < 7; i++) {
    let hoursString = ''
    let day = current.add(1, 'days').format('dddd')
    let d = current.format('ddd')
    let timesArray = info.times.hours[d]

    if (timesArray) {
      let open = moment(timesArray[0], 'H:mm').format('h:mm a')
      let close = moment(timesArray[1], 'H:mm').format('h:mm a')
      hoursString = open + ' - ' + close
    } else {
      hoursString = 'Closed'
    }

    let dayString = day + ': ' + hoursString
    dayTimes.push(<Text key={d} style={style}>{dayString}</Text>)
  }

  return dayTimes
}