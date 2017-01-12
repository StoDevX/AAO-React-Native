// @flow
import React from 'react'
import {View, StyleSheet, Platform} from 'react-native'

const styles = StyleSheet.create({
  separator: {
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderBottomColor: Platform.OS === 'ios' ? '#c8c7cc' : '#e0e0e0',
  },
})

export function Separator({style}: {style?: mixed}) {
  return <View style={[styles.separator, style]} />
}
