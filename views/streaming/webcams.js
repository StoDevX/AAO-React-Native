/**
 * All About Olaf
 * Webcams page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  WebView,
} from 'react-native'
import webcamInfo from '../../data/webcams'

const inlineVideo = url => `
  <video autoplay muted>
    <source src="${url}" type="application/x-mpegURL">
  </video>
`


export default class WebcamsView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>Webcams</Text>
        <WebView
          style={styles.video}
          source={{html: inlineVideo(webcamInfo[0].url)}}
        />
      </View>
    )
  }

  loadStart(...args) {
    console.log('loadStart', ...args)
  }
  setDuration(...args) {
    console.log('setDuration', ...args)
  }
  setTime(...args) {
    console.log('setTime', ...args)
  }
  onEnd(...args) {
    console.log('onEnd', ...args)
  }
  videoError(...args) {
    console.log('videoError', ...args)
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  }
})
