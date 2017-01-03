// @flow
import React from 'react'
import {
  StyleSheet,
  WebView,
} from 'react-native'
import {text as legal} from '../../docs/legal.json'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
})

export default function LegalView() {
  let source = `
    <style>
    body {
      -webkit-overflow-scrolling: touch;
      font-family: -apple-system, Roboto, sans-serif;
      background-color: transparent;
    }
    </style>
    ${legal}
  `
  return (
    <WebView style={styles.container} source={{html: source}} />
  )
}
LegalView.propTypes = {}
