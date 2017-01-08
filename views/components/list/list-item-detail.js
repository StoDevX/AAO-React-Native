// @flow
import React from 'react'
import {StyleSheet, Platform, Text} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
  detail: {
    color: c.iosDisabledText,
    paddingTop: 3,
    fontSize: 13,
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
