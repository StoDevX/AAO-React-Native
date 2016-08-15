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

// const inlineVideo = url => `
//   <style>
//     body {margin: 0}
//     * {box-sizing: border-box}
//     video {
//       position: absolute;
//       top: 0;
//       width: 100%;
//       height: 100%;
//     }
//   </style>
//   <video autoplay muted webkit-playsinline>
//     <source src="${url}" type="application/x-mpegURL">
//   </video>
// `

const videoAsThumbnail = url => `
  <style>
    body {margin: 0}
    * {box-sizing: border-box}
    video {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
    }
  </style>
  <video muted>
    <source src="${url}" type="application/x-mpegURL">
  </video>
`


export default function WebcamsView() {
  return (
    <View style={styles.container}>
      <Text>Webcams</Text>
      {webcamInfo.map(webcam =>
        <View style={styles.row} key={webcam.name}>
          <Text>{webcam.name}</Text>
          <WebView
            style={styles.video}
            mediaPlaybackRequiresUserAction={false}
            scalesPageToFit={false}
            allowsInlineMediaPlayback={true}
            scrollEnabled={false}
            source={{html: videoAsThumbnail(webcam.url)}}
          />
        </View>
      )}
    </View>
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    // display: 'flex',
    flexDirection: 'column',
  },
  row: {
    // display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
  video: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // height: 210,
  },
})
