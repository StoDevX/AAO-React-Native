/**
 * @flow
 * Exports the RightButton side of the Navigator.NavBar
 */

import React from 'react'
import {Navigator} from 'react-native'
import {CloseScreenButton} from './special-closescreen'
import {EditHomeButton} from './special-edithome'
import type {RouteType} from '../../types'

export function RightButton(route: RouteType, navigator: Navigator) {
  if (route.rightButton) {
    return route.rightButton({contentContainerStyle: styles.button, style: styles.icon})
  }

  if (route.onDismiss) {
    return <CloseScreenButton route={route} navigator={navigator} />
  }

  if (route.id === 'HomeView') {
    return <EditHomeButton route={route} navigator={navigator} />
  }
}
