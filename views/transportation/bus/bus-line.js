// @flow
/**
 * All About Olaf
 * Bus Line list helper
 */

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'
import BusStopView from './bus-stop'
import type {BusLineType, BusStopType, DailyBusSchedulesType, SingleBusScheduleType} from '../types'
import moment from 'moment'
import find from 'lodash/find'


let styles = StyleSheet.create({
  busLine: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 10,
  },
})

const allDaysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function isValidDayPair(dayString): bool {
  const scheduleDayRegex = /(Su|Mo|Tu|We|Th|Fr|Sa)(-(Su|Mo|Tu|We|Th|Fr|Sa))?/
  return scheduleDayRegex.test(dayString)
}

function checkSchedules(schedules: DailyBusSchedulesType) {
  const daySets = Object.keys(schedules)

  daySets.forEach(dayString => {
    if (!isValidDayPair(dayString)) {
      throw new Error(`"${dayString}" is not a valid day pairing!`)
    }
  })

  daySets
    .map(dayPair => dayPair.split('-'))
    .map(pair => pair.map(day => allDaysOfWeek.indexOf(day)))
    .forEach(([a, b], i) => {
      if (a === -1) {
        throw new Error(`the first day of "${daySets[i]}" is invalid`)
      }
      if (b === -1) {
        throw new Error(`the second day of "${daySets[i]}" is invalid`)
      }
    })
}

function getScheduleForNow(schedules: DailyBusSchedulesType, now=moment.tz('America/Winnipeg')): SingleBusScheduleType {
  const thisWeekday = now.day() // 0-6, Sunday to Saturday.

  if (process.env.NODE_ENV !== 'production') {
    checkSchedules(schedules)
  }

  return find(schedules, (schedule, dayPair) => {
    // we need to turn the strings (eg. "Mo-Fr") into paired arrays (eg. [1,5]).
    // split them apart and perform a lookup on the array of all days.
    let [startDay, endDay] = dayPair.split('-').map(day => allDaysOfWeek.indexOf(day))

    // check if today (eg. 0) is within the paired date range
    if (startDay === undefined) {
      return startDay === thisWeekday
    }
    return startDay <= thisWeekday && thisWeekday <= endDay
  })
}

export default function BusLineView({line}: {line: BusLineType}) {
  let scheduleToShow = getScheduleForNow(line.schedules)
  return (
    <View>
      <Text style={styles.busLine}>{line.line}</Text>
      {scheduleToShow.map((data: BusStopType, i) =>
        <BusStopView key={i} stop={data} />)}
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
}
