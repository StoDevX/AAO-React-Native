// @flow
import React from 'react'
import {StyleSheet, Platform, Text} from 'react-native'
import * as c from '../colors'

const FONT_SIZE = 14
const styles = StyleSheet.create({
  detail: {
    paddingTop: 4,
    fontSize: FONT_SIZE,
    lineHeight: FONT_SIZE * 1.25,
    ...Platform.select({
      ios: {
        color: c.iosDisabledText,
      },
      android: {
        color: c.iosDisabledText,
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
