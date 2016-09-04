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
    paddingLeft: 55,
    borderBottomWidth: 1,
    borderColor: '#ebebeb',
  },
  rowSectionHeaderText: {
    color: 'rgb(113, 113, 118)',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    flexDirection: 'row',
  },
  busWillSkipStopTitle: {
    color: c.iosText,
  },
  busWillSkipStopDetail: {},
  busWillSkipStopDot: {
    backgroundColor: 'transparent',
  },
  row: {
    marginLeft: 0,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notLastRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  itemTitle: {
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemDetail: {
    color: c.iosText,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
    textAlign: 'left',
  },
  bar: {
    width: 30,
    paddingTop: 5,
    borderRadius: 30,
    marginLeft: 10,
    marginRight: 15,
    marginTop: -15,
    marginBottom: -15,
  },
  dot: {
    marginLeft: -35,
    marginRight: 15,
    height: 10,
    width: 10,
    borderRadius: 10,
  },
  passedStop: {
    backgroundColor: 'black',
  },
  beforeStop: {
    backgroundColor: 'white',
  },
  atStop: {
    // backgroundColor: 'red',
    borderWidth: 3,
    borderColor: 'white',
    width: 20,
    height: 20,
    marginLeft: -40,
    marginRight: 10,
  },
  rowContainer: {
    flex: 1,
  },
})

// const lineColors = StyleSheet.create({
//   Blue:
// })

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

  let passedDotColor = c.brickRed
  if (line.line === 'Blue') {
    passedDotColor = c.midnightBlue
  } else if (line.line === 'Express') {
    passedDotColor = c.hollyGreen
  }

  let unpassedDotColor = c.paleRose
  if (line.line === 'Blue') {
    unpassedDotColor = c.iceberg
  } else if (line.line === 'Express') {
    unpassedDotColor = c.honeydew
  }

  let activeDotColor = barColor
  if (line.line === 'Blue') {
    activeDotColor = barColor
  } else if (line.line === 'Express') {
    activeDotColor = barColor
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>
          {line.line.toUpperCase()} • {now.format('h:mma')}
        </Text>
      </View>
      <View style={[styles.listContainer]}>
        <View style={[styles.bar, {backgroundColor: barColor}]} />
        <View style={[styles.rowContainer]}>
          {pairs.map(([place, time], i) => {
            return <View
              key={i}
              style={[
                styles.row,
                i < pairs.length - 1 ? styles.notLastRowContainer : null,
              ]}
            >
              <View style={[
                styles.dot,
                time && now.isAfter(time)
                  ? [styles.passedStop, {backgroundColor: passedDotColor}]
                  : [styles.beforeStop, {backgroundColor: unpassedDotColor}],
                time && now.isSame(time, 'minute')
                  ? [styles.atStop, {backgroundColor: passedDotColor, borderColor: unpassedDotColor}]
                  : null,
                time === false
                  ? styles.busWillSkipStopDot
                  : null,
              ]} />
              <View style={{flex: 1}}>
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
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
  style: React.PropTypes.object,
}
