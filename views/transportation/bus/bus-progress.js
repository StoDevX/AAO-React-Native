// @flow

import React from 'react'
import {
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type {BusScheduleType} from './types'
import moment from 'moment-timezone'
import BusStopView from './bus-stop'
const TIMEZONE = 'America/Winnipeg'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  bar: {
    width: 20,
    paddingTop: 5,
    borderRadius: 10,
    marginLeft: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'red',
  },
  dot: {
    marginLeft: -15,
    marginRight: 5,
    height: 10,
    width: 10,
    borderRadius: 10,
    // marginBottom: 5,
  },
  passedStop: {
    backgroundColor: 'black',
  },
  beforeStop: {
    backgroundColor: 'white',
  },
  textContainer: {
    paddingTop: 5,
    paddingBottom: 5,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingTop: 2,
    paddingBottom: 2,
  },
})

export default function BusProgressView({pairs, now}: {pairs: [string, string][], now: Object}) {
  return (
    <View style={styles.container}>
      <View style={styles.bar} />
      <View style={styles.textContainer}>
        {pairs.map(([place, time], i) =>
          <View key={i} style={styles.row}>
            <View style={[styles.dot, now.isAfter(moment.tz(time, 'h:mma', TIMEZONE)) ? styles.passedStop : styles.beforeStop]} />
            <BusStopView style={{flex: 1}} stop={place} time={time} />
          </View>)}
      </View>
    </View>
  )
}
BusProgressView.propTypes = {
  now: React.PropTypes.object.isRequired,
  pairs: React.PropTypes.array.isRequired,
}
