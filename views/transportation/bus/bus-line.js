// @flow

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'
import type {BusLineType} from './types'
import getScheduleForNow from './get-schedule-for-now'
import getSetOfStopsForNow from './get-set-of-stops-for-now'
import zip from 'lodash/zip'
import moment from 'moment-timezone'
import * as c from '../../components/colors'

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
    marginRight: 10,
    marginTop: -15,
    marginBottom: -15,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dot: {
    marginLeft: -30,
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
  rowContainer: {
    flex: 1,
  },
})

export default function BusLineView({line, style}: {line: BusLineType, style: Object|number}) {
  let schedule = getScheduleForNow(line.schedules)
  let now = moment.tz(TIMEZONE)
  let times = getSetOfStopsForNow(schedule, now)
  let timesIndex = schedule.times.indexOf(times)

  let pairs = zip(schedule.stops, times, schedule.coordinates)

  let color = c.salmon
  if (line.line === 'Blue') {
    color = c.steelBlue
  } else if (line.line === 'Express') {
    color = c.paleGreen
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>
          {line.line.toUpperCase()}
        </Text>
      </View>
      <View style={[styles.listContainer]}>
        <View style={[styles.bar, {backgroundColor: color}]} />
        <View style={[styles.rowContainer]}>
          {pairs.map(([place, time], i) =>
            <View
              key={i}
              style={[
                styles.row,
                i < pairs.length - 1 ? styles.notLastRowContainer : null,
              ]}
            >
              <View style={[
                styles.dot,
                now.isAfter(moment.tz(time, 'h:mma', TIMEZONE))
                  ? styles.passedStop
                  : styles.beforeStop,
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
                    .map(time => time === false ? 'None' : time)
                    .join(' • ')}
                </Text>
              </View>
            </View>)}
        </View>
      </View>
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
  style: React.PropTypes.object,
}
