/**
 * All About Olaf
 * KSTO page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

export default class KSTOView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>KSTO Radio</Text>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
