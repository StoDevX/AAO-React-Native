/**
 * @flow
 * Exports a button that closes the current overlay screen
 */

import * as React from 'react'
import {Text, Platform, StyleSheet} from 'react-native'
import {Touchable} from '../touchable'
import type {NavType} from '../../types'
import {commonStyles} from './styles'

export function CloseScreenButton({
  navigation,
  buttonStyle,
}: {
  navigation: NavType,
  buttonStyle?: any,
}) {
  return (
    <Touchable
      borderless={true}
      highlight={false}
      onPress={() => navigation.goBack()}
      style={[commonStyles.button, buttonStyle]}
    >
      <Text style={[commonStyles.text, styles.text]}>Done</Text>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  text: {
    ...Platform.select({
      ios: {
        fontWeight: '600',
      },
      android: {
        fontWeight: '400',
      },
    }),
  },
})
