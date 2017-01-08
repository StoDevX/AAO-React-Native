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

  let scheduledMoments: FancyBusTimeListType[] = schedule.times.map(timeset => {
    return timeset.map(time =>
      time === false
        ? false
        : moment
          // interpret in Central time
          .tz(time, TIME_FORMAT, true, TIMEZONE)
          // and set the date to today
          .dayOfYear(now.dayOfYear()))
  })

  let moments: FancyBusTimeListType = getSetOfStopsForNow(scheduledMoments, now)
  let timesIndex = scheduledMoments.indexOf(moments)

  let pairs: [[string, typeof moment]] = zip(schedule.stops, moments)

  let isLastBus = timesIndex === scheduledMoments.length - 1

  let lineTitle = line.line
  if (timesIndex === 0 && now.isBefore(head(moments))) {
    lineTitle += ` — Starting ${head(moments).format('h:mma')}`
  } else if (now.isAfter(last(moments))) {
    lineTitle += ' — Over for Today'
  } else if (isLastBus) {
    lineTitle += ' — Last Bus'
  } else {
    lineTitle += ' — Running'
  }

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
            isLastRow={i === pairs.length - 1}

            barColor={barColor}
            currentStopColor={currentStopColor}
          />)}
      </View>
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
  now: React.PropTypes.instanceOf(moment).isRequired,
  style: React.PropTypes.object,
}
