/**
 * @flow
 * Exports a button that opens the Settings screen
 */

import React from 'react'
import {StyleSheet, Platform} from 'react-native'
import * as c from '../colors'
import {Touchable} from '../touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import type {NavType} from '../../modules/types'

export function OpenSettingsButton({
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
      style={[styles.button, buttonStyle]}
      onPress={() => navigation.navigate('SettingsView')}
    >
      <Icon style={styles.icon} name="ios-settings" />
    </Touchable>
  )
}

const styles = StyleSheet.create({
  icon: {
    color: c.white,
    fontSize: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 16,
    paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
  },
})
