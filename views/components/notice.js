// @flow
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'

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
})

export function NoticeView({text, style}: {text: string, style?: any}) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        {text}
      </Text>
    </View>
  )
}
