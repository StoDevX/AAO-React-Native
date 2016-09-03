// @flow

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'
import BusStopView from './bus-stop'
import type {BusLineType} from './types'
import getScheduleForNow from './get-schedule-for-now'
import getSetOfStopsForNow from './get-set-of-stops-for-now'
import BusProgressView from './bus-progress'
import zip from 'lodash/zip'
import moment from 'moment-timezone'
import BusMapView from './bus-map'

const TIMEZONE = 'America/Winnipeg'

let styles = StyleSheet.create({
  busLine: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 10,
  },
})

export default function BusLineView({line}: {line: BusLineType}) {
  let schedule = getScheduleForNow(line.schedules)
  let now = moment.tz(TIMEZONE)
  let times = getSetOfStopsForNow(schedule, now)

  let pairs = zip(schedule.stops, times, schedule.coordinates)
  // let contents = pairs.map(([stop, time], i) =>
  //   <BusStopView key={i} stop={stop} time={time} />)

  return (
    <View>
      <Text style={styles.busLine}>{line.line}</Text>
      <View>
        {/*line.line === 'Express' && <BusMapView pairs={pairs} />*/}
        {/*<View style={{flexDirection: 'row'}}>*/}
          <BusProgressView pairs={pairs} now={now} />
          {/*<View style={{flex: 1}}>{contents}</View>*/}
        {/*</View>*/}
      </View>
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
}
