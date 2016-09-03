// @flow

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'
import BusStopView from './bus-stop'
import type {BusLineType} from './types'
import getScheduleForNow from './get-schedule-for-now'
import getSetOfStopsForNow, {getFirstTime, getLastTime} from './get-set-of-stops-for-now'
import zip from 'lodash/zip'

let styles = StyleSheet.create({
  busLine: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 10,
  },
})

export default function BusLineView({line}: {line: BusLineType}) {
  let schedule = getScheduleForNow(line.schedules)
  let times = getSetOfStopsForNow(schedule)

  let pairs = zip(schedule.stops, times)
  let contents = pairs.map(([stop, time], i) =>
    <BusStopView key={i} stop={stop} time={time} />)

  return (
    <View>
      <Text style={styles.busLine}>{line.line}</Text>
      {contents}
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
}
