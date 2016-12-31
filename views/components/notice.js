// @flow
import React from 'react'
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    textAlign: 'center',
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
})

export function NoticeView({text, style}: {text: string, style?: any}) {
  let spinner = text === 'Loading…' ? <ActivityIndicator style={styles.spinner} /> : null
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        {text}
      </Text>
      {spinner}
    </View>
  )
}
