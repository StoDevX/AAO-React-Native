// @flow
import React from 'react'
import {StyleSheet, Platform, Text} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
  title: {
    fontSize: Platform.OS === 'ios' ? 16 : 17,
    fontWeight: Platform.OS === 'ios' ? '500' : '600',
    color: c.black,
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
