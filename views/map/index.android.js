/**
 * All About Olaf
 * Android Map page
 */

// This is not the implementation that we want.
// This was done to get code out the door since none of the developers could
// figure out how to render the map on Android. Changes to this hack are welcome.


import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Linking,
} from 'react-native'
import * as c from '../components/colors'
import Button from 'react-native-button'
import {data as mapInfo} from '../../docs/map.json'
import {tracker} from '../../analytics'

export default function OlafMapView() {
  return (
    <View style={styles.container}>
      <Text>{mapInfo.description}</Text>
      <Button
        onPress={() => Linking.openURL(mapInfo.url).catch(err => {
          tracker.trackException(err.message)
          console.error('An error occurred', err)
        })}
        style={styles.button}
      >
          View Map
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginLeft: 10,
    flexWrap: 'wrap',
  },
  button: {
    marginTop: 15,
    padding: 10,
    color: c.white,
    backgroundColor: c.denim,
  },
})
