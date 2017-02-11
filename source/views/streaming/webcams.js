// @flow
/**
 * All About Olaf
 * Webcams page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  WebView,
} from 'react-native'
import {data as webcams} from '../../docs/webcams'

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
    <ScrollView style={styles.container}>
      {webcams.map(webcam =>
        <View style={styles.row} key={webcam.name}>
          <View style={styles.webCamTitleBox}>
            <Text style={styles.webcamName}>{webcam.name}</Text>
          </View>
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
    </ScrollView>
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  row: {
    paddingTop: 20,
  },
  webCamTitleBox: {
    backgroundColor: 'rgb(248, 248, 248)',
    paddingBottom: 5,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ebebeb',
  },
  webcamName: {
    paddingTop: 5,
    paddingLeft: 20,
    paddingBottom: 10,
  },
  video: {
    height: 210,
  },
})
