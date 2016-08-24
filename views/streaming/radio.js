// @flow
/**
 * All About Olaf
 * KSTO page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  WebView,
} from 'react-native'

// let kstoDownload = 'itms://itunes.apple.com/us/app/ksto/id953916647'

const url = 'https://pages.stolaf.edu/ksto/listen/'

export default function KSTOView() {
  return (
    <View style={styles.container}>
      <WebView
        source={{uri: url}}
        startInLoadingState={true}
        style={styles.container}
      />
    </View>
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
