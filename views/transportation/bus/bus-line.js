// @flow

import React from 'react'
import {View, StyleSheet} from 'react-native'
import type {BusLineType, FancyBusTimeListType} from './types'
import getScheduleForNow from './get-schedule-for-now'
import getSetOfStopsForNow from './get-set-of-stops-for-now'
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
    marginTop: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8c7cc',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    flexDirection: 'column',
  },
})

export default function BusLineView({
  line,
  style,
  now,
}: {
  line: BusLineType,
  style: Object|number|Array<Object|number>,
  now: typeof moment,
}) {
  let schedule = getScheduleForNow(line.schedules, now)
  if (!schedule) {
    return null
  }

  let scheduledMoments: FancyBusTimeListType[] = schedule.times.map(timeset => {
    return timeset.map(time =>
      time === false
        ? false
        : moment
          .tz(time, TIME_FORMAT, true, TIMEZONE)
          .dayOfYear(now.dayOfYear()))
  })

  let moments: FancyBusTimeListType = getSetOfStopsForNow(scheduledMoments, now)
  let timesIndex = scheduledMoments.indexOf(moments)

  let pairs: [[string, typeof moment]] = zip(schedule.stops, moments)

  let barColor = c.salmon
  if (line.line === 'Blue') {
    barColor = c.steelBlue
  } else if (line.line === 'Express') {
    barColor = c.moneyGreen
  }

  let currentStopColor = c.brickRed
  if (line.line === 'Blue') {
    currentStopColor = c.midnightBlue
  } else if (line.line === 'Express') {
    currentStopColor = c.hollyGreen
  }

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
      <BusLineTitle title={lineTitle} />
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
