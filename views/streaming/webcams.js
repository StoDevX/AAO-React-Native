/**
 * All About Olaf
 * Webcams page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

export default class WebcamsView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>Webcams</Text>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
