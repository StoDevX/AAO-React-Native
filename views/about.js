/**
 * All About Olaf
 * iOS About page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

export default class AboutView extends React.Component {
  // Render a given scene
  render() {
    return (
      <View style={styles.container}>
        <Text>About</Text>
      </View>
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
