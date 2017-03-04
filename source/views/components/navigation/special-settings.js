/**
 * @flow
 * Exports a button that opens the Settings screen
 */

import React from 'react'
import {Navigator, StyleSheet, Platform} from 'react-native'
import {Touchable} from '../touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import type {RouteType} from '../../types'


export function OpenSettingsButton(
  {route, navigator, buttonStyle}: {route: RouteType, navigator: Navigator, buttonStyle?: any}
) {
  return (
    <Touchable
      borderless
      highlight={false}
      style={[styles.button, buttonStyle]}
      onPress={() => openSettings(route, navigator)}
    >
      <Icon style={styles.icon} name='ios-settings' />
    </Touchable>
  )
}


let settingsButtonActive = false
function openSettings(route, navigator) {
  if (settingsButtonActive) {
    return
  }

  function closeSettings(route, navigator) {
    settingsButtonActive = false
    navigator.pop()
  }

  settingsButtonActive = true
  navigator.push({
    id: 'SettingsView',
    title: 'Settings',
    index: route.index + 1,
    sceneConfig: 'fromBottom',
    onDismiss: closeSettings,
  })
}

const styles = StyleSheet.create({
  icon: {
    color: 'white',
    fontSize: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 16,
    paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
  },
})
