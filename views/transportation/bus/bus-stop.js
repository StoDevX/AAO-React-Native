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
import type {BusStopType} from '../types'
import moment from 'moment-timezone'

const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'H:mma'

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
    marginRight: 5,
    marginLeft: 5,
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

function getNextStopTime(times, currentTime=moment.tz(CENTRAL_TZ)): string|false {
  let nextStopTime = times
    .map(t => moment.tz(t, TIME_FORMAT, true, CENTRAL_TZ))
    .find(time => currentTime.isBefore(time))

  if (nextStopTime) {
    return nextStopTime.format('h:mma')
  }

  return false
}

export default function BusStopView({stop}: {stop: BusStopType}) {
  return (
    <View style={styles.container}>
      <Text style={styles.location}>{stop.location}</Text>
      <Text style={styles.stopTime}>{getNextStopTime(stop.times) || 'None'}</Text>
    </View>
  )
}
BusStopView.propTypes = {
  stop: React.PropTypes.shape({
    location: React.PropTypes.string.isRequired,
    times: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  }).isRequired,
}
