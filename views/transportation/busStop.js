// @flow
/**
 * All About Olaf
 * Funcitonal component for the rows of the bus page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type {BusStopType} from './types'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'HH:mm:ss'

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
    flexDirection: 'row',
  },
  location: {
    flex: 1,
    textAlign: 'left',
  },
  stopTime: {
    flex: 1,
    textAlign: 'right',
  },
})

function getNextStopTime(times) {
  let returner = ''
  times.some(time => {
    let currentTime = moment.tz(CENTRAL_TZ)
    let stopTime = moment.tz(time, TIME_FORMAT, true, CENTRAL_TZ)
    if (currentTime.isBefore(stopTime)) {
      returner = time
      return returner
    }
    return null
  })
  if (returner) {
    return returner
  } else {
    return 'None'
  }
}

export default function BusStopView(props: BusStopType) {
  return (
    <View style={styles.container}>
      <Text style={styles.location}>{props.location}</Text>
      <Text style={styles.stopTime}>{getNextStopTime(props.times)}</Text>
    </View>
  )
}
BusStopView.propTypes = {
  location: React.PropTypes.string.isRequired,
  times: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
}
