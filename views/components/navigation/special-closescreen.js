/**
 * @flow
 * Exports a button that closes the current overlay screen
 */

import React from 'react'
import {Text, Navigator, Platform, StyleSheet} from 'react-native'
import {Touchable} from '../touchable'
import noop from 'lodash/noop'
import type {RouteType} from '../../types'
import {commonStyles} from './styles'

export function CloseScreenButton(
  {route, navigator, buttonStyle}: {route: RouteType, navigator: Navigator, buttonStyle?: any}
) {
  const onDismiss = route.onDismiss ? route.onDismiss : noop
  return (
    <Touchable
      borderless
      highlight={false}
      style={[commonStyles.button, buttonStyle]}
      onPress={() => onDismiss(route, navigator)}
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
