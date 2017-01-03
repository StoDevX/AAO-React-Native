// @flow
import React from 'react'
import {
  StyleSheet,
  WebView,
} from 'react-native'
import {text as privacy} from '../../docs/privacy.json'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
})

export default function PrivacyView() {
  let source = `
    <style>
    body {
      -webkit-overflow-scrolling: touch;
      font-family: -apple-system, Roboto, sans-serif;
      background-color: transparent;
    }
    blockquote {
      font-style: italic;
      margin-left: 1em;
    }
    </style>
    ${privacy}
  `
  return (
    <WebView style={styles.container} source={{html: source}} />
  )
}
