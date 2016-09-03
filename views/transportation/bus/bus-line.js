// @flow

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'
import type {BusLineType} from './types'
import getScheduleForNow from './get-schedule-for-now'
import getSetOfStopsForNow from './get-set-of-stops-for-now'
import BusProgressView from './bus-progress'
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
})

export default function BusLineView({line, style}: {line: BusLineType, style: Object|number}) {
  let schedule = getScheduleForNow(line.schedules)
  let now = moment.tz(TIMEZONE)
  let times = getSetOfStopsForNow(schedule, now)

  let pairs = zip(schedule.stops, times, schedule.coordinates)

  let color = c.red
  if (line.line === 'Blue') {
    color = c.blue
  } else if (line.line === 'Express') {
    color = c.teal
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>
          {line.line.toUpperCase()}
        </Text>
      </View>
      <BusProgressView
        pairs={pairs}
        now={now}
        color={color}
      />
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
  style: React.PropTypes.object,
}
