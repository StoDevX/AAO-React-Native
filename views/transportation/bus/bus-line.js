// @flow

import React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import type {BusLineType, FancyBusTimeListType} from './types'
import {getScheduleForNow, getSetOfStopsForNow} from './lib'
import get from 'lodash/get'
import zip from 'lodash/zip'
import head from 'lodash/head'
import last from 'lodash/last'
import moment from 'moment-timezone'
import * as c from '../../components/colors'

import {BusLineTitle} from './bus-line-title'
import {BusStopRow} from './bus-stop-row'

const TIME_FORMAT = 'h:mma'
const TIMEZONE = 'America/Winnipeg'

let styles = StyleSheet.create({
  container: {
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderColor: '#c8c7cc',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#ffffff',
    elevation: 5,
  },
  listContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Platform.OS === 'ios' ? '#ffffff' : 'transparent',
  },
})

const barColors = {
  'Blue Line': c.steelBlue,
  'Express Bus': c.moneyGreen,
  'Red Line': c.salmon,
}
const stopColors = {
  'Blue Line': c.midnightBlue,
  'Express Bus': c.hollyGreen,
  'Red Line': c.brickRed,
}

function makeSubtitle({now, moments, isLastBus}) {
  let lineDetail = 'Running'

  if (now.isBefore(head(moments))) {
    lineDetail = `Starts ${now.to(head(moments))}`
  } else if (now.isAfter(last(moments))) {
    lineDetail = 'Over for Today'
  } else if (isLastBus) {
    lineDetail = 'Last Bus'
  }

  return lineDetail
}

export function BusLine({line, now}: {line: BusLineType, now: moment}) {
  // grab the colors (with fallbacks) via _.get
  const barColor = get(barColors, line.line, c.black)
  const currentStopColor = get(stopColors, line.line, c.gray)
  const androidColor = Platform.OS === 'android' ? {color: barColor} : null

  const schedule = getScheduleForNow(line.schedules, now)
  if (!schedule) {
    return (
      <View style={[styles.container, style]}>
        <BusLineTitle title={line.line} androidColor={barColor} />
        <View>
          <Text>This line is not running today.</Text>
        </View>
      </View>
    )
  }

  const scheduledMoments: FancyBusTimeListType[] = schedule.times.map(timeset => {
    return timeset.map(time =>
      // either pass `false` through or return a parsed time
      time === false ? false : moment
        // interpret in Central time
        .tz(time, TIME_FORMAT, true, TIMEZONE)
        // and set the date to today
        .dayOfYear(now.dayOfYear()))
  })

  const moments: FancyBusTimeListType = getSetOfStopsForNow(scheduledMoments, now)
  const pairs: [[string, moment]] = zip(schedule.stops, moments)

  const timesIndex = scheduledMoments.indexOf(moments)
  const isLastBus = timesIndex === scheduledMoments.length - 1
  const subtitle = makeSubtitle({now, moments, isLastBus})

  return (
    <View style={[styles.container, style]}>
      <BusLineTitle title={lineTitle} androidColor={barColor} />
      <View style={[styles.listContainer]}>
        {pairs.map(([place, moment], i) =>
          <BusStopRow
            key={i}
            index={i}

            place={place}
            times={scheduledMoments.slice(timesIndex)}

            now={now}
            time={moment}

            barColor={barColor}
            currentStopColor={currentStopColor}
          />)}
      </View>
    </View>
  )
}
