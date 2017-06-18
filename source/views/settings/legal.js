// @flow
import React from 'react'
import {StyleSheet, WebView} from 'react-native'
import * as c from '../components/colors'
import {text as legal} from '../../../docs/legal.json'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: c.transparent,
  },
})

export default function LegalView() {
  return <WebView style={styles.container} source={{html: legal}} />
}
LegalView.navigationOptions = {
  title: 'Legal',
}
