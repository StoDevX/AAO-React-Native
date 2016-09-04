// @flow

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'
import type {BusLineType} from './types'
import getScheduleForNow from './get-schedule-for-now'
import getSetOfStopsForNow from './get-set-of-stops-for-now'
import zip from 'lodash/zip'
import moment from 'moment-timezone'
import * as c from '../../components/colors'

const TIME_FORMAT = 'h:mma'
const TIMEZONE = 'America/Winnipeg'

let styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  rowSectionHeader: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 15,
    borderBottomWidth: 1,
    borderColor: '#ebebeb',
  },
  rowSectionHeaderText: {
    color: 'rgb(113, 113, 118)',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    flexDirection: 'column',
  },
  busWillSkipStopTitle: {
    color: c.iosText,
  },
  busWillSkipStopDetail: {},
  busWillSkipStopDot: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
  rowDetail: {
    flex: 1,
    marginLeft: 0,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'column',
  },
  notLastRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  itemTitle: {
    color: c.black,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemDetail: {
    color: c.iosText,
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: 13,
    textAlign: 'left',
  },
  barContainer: {
    paddingRight: 5,
    width: 45,
    flexDirection: 'column',
    alignItems: 'center',
  },
  bar: {
    flex: 1,
    width: 5,
  },
  dot: {
    height: 15,
    width: 15,
    marginTop: -20,
    marginBottom: -20,
    borderRadius: 20,
    zIndex: 1,
  },
  passedStop: {
    height: 12,
    width: 12,
  },
  beforeStop: {
    borderWidth: 3,
    backgroundColor: 'white',
    height: 18,
    width: 18,
  },
  atStop: {
    height: 20,
    width: 20,
    borderColor: 'white',
  },
})

export default function BusLineView({line, style}: {line: BusLineType, style: Object|number}) {
  let schedule = getScheduleForNow(line.schedules)
  let now = moment.tz('5:21pm', 'h:mma', true, TIMEZONE)
  now.dayOfYear(moment.tz(TIMEZONE).dayOfYear())

  schedule.times = schedule.times.map(timeset => {
    return timeset.map(time =>
      time === false
        ? false
        : moment
          .tz(time, TIME_FORMAT, true, TIMEZONE)
          .dayOfYear(now.dayOfYear()))
  })

  let times = getSetOfStopsForNow(schedule, now)
  let timesIndex = schedule.times.indexOf(times)

  let pairs: [[string], [typeof moment]] = zip(schedule.stops, times)

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

  let lineTitle = line.line
  if (timesIndex === 0 && now.isBefore(head(times))) {
    lineTitle += ` — Starting ${head(times).format('h:mma')}`
  } else if (timesIndex === schedule.times.length - 1) {
    lineTitle += ' — Last Bus'
  } else if (now.isAfter(last(times))) {
    lineTitle += ' — Over for Today'
  } else {
    lineTitle += ' — Running'
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>
          {lineTitle.toUpperCase()}
        </Text>
      </View>
      <View style={[styles.listContainer]}>
        {pairs.map(([place, time], i) => {
          return <View key={i} style={styles.row}>
            <View style={styles.barContainer}>
              <View style={[styles.bar, {backgroundColor: barColor}]} />
              <View
                style={[
                  styles.dot,
                  time && now.isAfter(time)
                    ? [styles.passedStop, {borderColor: barColor, backgroundColor: barColor}]
                    : [styles.beforeStop, {borderColor: barColor}],
                  time && now.isSame(time, 'minute')
                    ? [styles.atStop, {borderColor: currentStopColor}]
                    : null,
                  time === false
                    ? styles.busWillSkipStopDot
                    : null,
                ]}
              />
              <View style={[styles.bar, {backgroundColor: barColor}]} />
            </View>
            <View style={[
              styles.rowDetail,
              i < pairs.length - 1 ? styles.notLastRowContainer : null,
            ]}>
              <Text style={[
                styles.itemTitle,
                time === false ? styles.busWillSkipStopTitle : null,
              ]}>
                {place}
              </Text>
              <Text
                style={[
                  styles.itemDetail,
                  time === false ? styles.busWillSkipStopDetail : null,
                ]}
                numberOfLines={1}
              >
                {schedule.times
                  .slice(timesIndex)
                  .map(timeSet => timeSet[i])
                  .map(time => time === false ? 'None' : time.format(TIME_FORMAT))
                  .join(' • ')}
              </Text>
            </View>
          </View>
        })}
      </View>
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
  style: React.PropTypes.object,
}
