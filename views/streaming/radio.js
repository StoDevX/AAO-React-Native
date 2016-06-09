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

let kstoDownload = 'itms://itunes.apple.com/us/app/ksto/id953916647'

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
