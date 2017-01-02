// @flow
import React from 'react'
import {
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native'
import {text as privacy} from '../../docs/privacy.json'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
    paddingBottom: 10,
  },
  privacy: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 10,
    lineHeight: 20,
  },
})

export default function PrivacyView() {
  return (
    <WebView style={styles.container}>
      {privacy.text}
    </WebView>
  )
}
