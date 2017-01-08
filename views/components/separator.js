// @flow
import React from 'react'
import {View, StyleSheet, Platform} from 'react-native'

const styles = StyleSheet.create({
  separator: {
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#c8c7cc',
      },
      android: {
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
    }),
  },
})

export function Separator({style}: {style?: any}) {
  return <View style={[styles.separator, style]} />
}
