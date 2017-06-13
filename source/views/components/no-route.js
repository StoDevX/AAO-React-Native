// @flow
import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {Touchable} from './touchable'
import type {TopLevelViewPropsType} from '../types'
import * as c from './colors'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: c.salmon,
    fontWeight: 'bold',
  },
})

export default function NoRoute({navigator}: TopLevelViewPropsType) {
  return (
    <View style={styles.container}>
      <Touchable style={styles.touchable} onPress={() => navigator.pop()}>
        <Text style={styles.text}>
          No Route Found
        </Text>
      </Touchable>
    </View>
  )
}
