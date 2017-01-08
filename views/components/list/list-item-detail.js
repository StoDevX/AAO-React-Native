// @flow
import React from 'react'
import {StyleSheet, Platform, Text} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
  detail: {
    paddingTop: 4,
    ...Platform.select({
      ios: {
        color: c.iosDisabledText,
        fontSize: 12,
      },
      android: {
        color: c.iosDisabledText,
        fontSize: 14,
      },
    }),
  },
})

type PropsType = {
  children?: any,
  style?: any,
  lines?: number,
};
export function Detail(props: PropsType) {
  return (
    <Text numberOfLines={props.lines} style={[styles.detail, props.style]}>
      {props.children}
    </Text>
  )
}
