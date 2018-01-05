/**
 * @flow
 * Exports a button that opens the Edit Home screen
 */

import * as React from 'react'
import {Text} from 'react-native'
import {Touchable} from '../touchable'
import type {NavType} from '../../types'
import {commonStyles} from './styles'

export function EditHomeButton({
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
      onPress={() => navigation.navigate('EditHomeView')}
      style={[commonStyles.button, buttonStyle]}
    >
      <Text style={commonStyles.text}>Edit</Text>
    </Touchable>
  )
}
