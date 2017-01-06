// @flow
import React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {Separator} from './separator'

const styles = StyleSheet.create({
  separator: {
    marginLeft: 15,
  },
})

export function ListSeparator(props: {styles?: any}) {
  if (Platform.OS === 'android') {
    return null
  }
  return <Separator style={[styles.separator, props.styles]} />
}
