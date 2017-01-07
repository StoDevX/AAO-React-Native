// @flow
import React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import type {BusLineType, FancyBusTimeListType} from './types'
import {getScheduleForNow, getSetOfStopsForNow} from './lib'
import zip from 'lodash/zip'
import head from 'lodash/head'
import last from 'lodash/last'
import moment from 'moment-timezone'
import * as c from '../../components/colors'

import {LineTitle} from './components/line-title'
import {BusRow} from './row'

const TIME_FORMAT = 'h:mma'
const TIMEZONE = 'America/Winnipeg'

const styles = StyleSheet.create({
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

export function BusLine({line, style, now}: {
  line: BusLineType,
  style?: any,
  now: moment,
}) {
  let barColor = c.salmon
  if (line.line === 'Blue Line') {
    barColor = c.steelBlue
  } else if (line.line === 'Express Bus') {
    barColor = c.moneyGreen
  }

  let currentStopColor = c.brickRed
  if (line.line === 'Blue Line') {
    currentStopColor = c.midnightBlue
  } else if (line.line === 'Express Bus') {
    currentStopColor = c.hollyGreen
  }

  let schedule = getScheduleForNow(line.schedules, now)
  if (!schedule) {
    return (
      <View style={[styles.container, style]}>
        <LineTitle title={line.line} androidColor={barColor} />
        <View>
          <Text>This line is not running today.</Text>
        </View>
      </View>
    )
  }

  let scheduledMoments: FancyBusTimeListType[] = schedule.times.map(timeset => {
    return timeset.map(time =>
      // either pass `false` through or return a parsed time
      time === false ? false : moment
        // interpret in Central time
        .tz(time, TIME_FORMAT, true, TIMEZONE)
        // and set the date to today
        .dayOfYear(now.dayOfYear()))
  })

  let moments: FancyBusTimeListType = getSetOfStopsForNow(scheduledMoments, now)
  let timesIndex = scheduledMoments.indexOf(moments)

  let pairs: [[string, moment]] = zip(schedule.stops, moments)

  let isLastBus = timesIndex === scheduledMoments.length - 1

  let lineTitle = line.line
  if (timesIndex === 0 && now.isBefore(head(moments))) {
    lineTitle += ` — Starts ${now.to(head(moments))}`
  } else if (now.isAfter(last(moments))) {
    lineTitle += ' — Over for Today'
  } else if (isLastBus) {
    lineTitle += ' — Last Bus'
  } else {
    lineTitle += ' — Running'
  }

  return (
    <View style={[styles.container, style]}>
      <LineTitle title={lineTitle} androidColor={barColor} />
      <View style={[styles.listContainer]}>
        {pairs.map(([place, moment], i) =>
          <BusRow
            key={i}
            index={i}

            place={place}
            times={scheduledMoments.slice(timesIndex)}

            now={now}
            time={moment}
            isLastRow={i === pairs.length - 1}

            barColor={barColor}
            currentStopColor={currentStopColor}
          />)}
      </View>
    </View>
  )
}
