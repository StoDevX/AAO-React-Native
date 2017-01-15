/**
 * @flow
 * Exports a button that closes the current overlay screen
 */

import React from 'react'
import {Text, Navigator} from 'react-native'
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
      <Text style={[commonStyles.text, {fontWeight: '600'}]}>Done</Text>
    </Touchable>
  )
}
