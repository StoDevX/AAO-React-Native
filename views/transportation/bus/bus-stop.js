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

const styles = StyleSheet.create({
  container: {
    // marginTop: 2,
    flex: 1,
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

export default function BusStopView({stop, time}: {stop: string, time: false|string}) {
  return (
    <View style={styles.container}>
      <Text style={styles.location}>{stop}</Text>
      <Text style={styles.stopTime}>{time === false ? 'None' : time}</Text>
    </View>
  )
}
BusStopView.propTypes = {
  stop: React.PropTypes.string.isRequired,
  time: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.bool]).isRequired,
}
