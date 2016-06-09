/**
 * All About Olaf
 * Weekly Movie page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

export default class WeeklyMovieView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>Building Hours</Text>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
