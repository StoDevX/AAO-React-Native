/**
 * @flow
 * Exports a button that opens the Edit Home screen
 */

import React from 'react'
import {Text, Navigator} from 'react-native'
import {Touchable} from '../touchable'
import type {RouteType} from '../../types'
import {commonStyles} from './styles'

export function EditHomeButton(
  {route, navigator, buttonStyle}: {route: RouteType, navigator: Navigator, buttonStyle?: any}
) {
  return (
    <Touchable
      borderless
      highlight={false}
      style={[commonStyles.button, buttonStyle]}
      onPress={() => openEditHome(route, navigator)}
    >
      <Text style={commonStyles.text}>Edit</Text>
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
