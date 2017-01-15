/**
 * @flow
 * Exports a button that opens the Edit Home screen
 */

import React from 'react'
import {Text, Navigator, StyleSheet, Platform} from 'react-native'
import {Touchable} from '../touchable'
import type {RouteType} from '../../types'

export function EditHomeButton(
  {route, navigator, buttonStyle}: {route: RouteType, navigator: Navigator, buttonStyle?: any}
) {
  return (
    <Touchable
      borderless
      highlight={false}
      style={[styles.button, buttonStyle]}
      onPress={() => openEditHome(route, navigator)}
    >
      <Text style={styles.text}>Edit</Text>
    </Touchable>
  )
}


let editHomeButtonActive = false
function openEditHome(route, navigator: Navigator) {
  if (editHomeButtonActive) {
    return
  }

  function closeEditHome(route, navigator) {
    editHomeButtonActive = false
    navigator.pop()
  }

  editHomeButtonActive = true
  navigator.push({
    id: 'EditHomeView',
    title: 'Edit Home',
    index: route.index + 1,
    sceneConfig: 'fromBottom',
    onDismiss: closeEditHome,
  })
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
  },
  text: {
    fontSize: 17,
    color: 'white',
    paddingVertical: Platform.OS === 'ios' ? 10 : 16,
  },
})
