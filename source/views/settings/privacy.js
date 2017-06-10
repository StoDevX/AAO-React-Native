// @flow
import React from 'react'
import {StyleSheet, WebView} from 'react-native'
import * as c from '../components/colors'
import {text as privacy} from '../../../docs/privacy.json'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: c.transparent,
  },
})

export default function PrivacyView() {
  return <WebView style={styles.container} source={{html: privacy}} />
}
PrivacyView.navigationOptions = {
  title: 'Privacy Policy',
}
