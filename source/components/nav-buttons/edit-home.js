/**
 * @flow
 * Exports a button that opens the Edit Home screen
 */

import React from 'react'
import {Text} from 'react-native'
import {Touchable} from '../touchable'
import type {NavType} from '../../modules/types'
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
      style={[commonStyles.button, buttonStyle]}
      onPress={() => navigation.navigate('EditHomeView')}
    >
      <Text style={commonStyles.text}>Edit</Text>
    </Touchable>
  )
}
