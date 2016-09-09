import React from 'react'
import {
  Text,
} from 'react-native'

import moment from 'moment'

export function allBuildingHours(info, style) {
  let dayTimes = []
  let hoursString = ''
  for (let i = 0; i < 7; i++) {
    let day = moment().add(i, 'days').format('dddd')
    let d = moment().add(i, 'days').format('ddd')
    let timesArray = info.times.hours[d]

    if (timesArray) {
      let open = moment(timesArray[0], 'H:mm').format('h:mm a')
      let close = moment(timesArray[1], 'H:mm').format('h:mm a')
      hoursString = open + ' - ' + close
    } else {
      hoursString = 'Closed'
    }

    let dayString = day + ': ' + hoursString
    dayTimes.push(<Text key={d} style={style.hoursText}>{dayString}</Text>)
  }

  return dayTimes
}