// @flow
import React from 'react'
import {StyleSheet, Platform, Text} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
  title: {
    color: c.black,
    fontSize: 17,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '600',
      },
    })
  },
})

type PropsType = {
  children?: any,
  style?: any,
  lines?: number,
};
export function Title(props: PropsType) {
  return (
    <Text numberOfLines={props.lines} style={[styles.title, props.style]}>
      {props.children}
    </Text>
  )
}
