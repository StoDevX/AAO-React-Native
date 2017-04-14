/**
 * @flow
 * Exports the RightButton side of the Navigator.NavBar
 */

import React from 'react'
import {Navigator} from 'react-native'
import noop from 'lodash/noop'
import {CloseScreenButton} from './special-closescreen'
import {EditHomeButton} from './special-edithome'
import {ShareButton} from './special-share'
import {rightButtonStyles} from './styles'
import type {RouteType} from '../../types'

export function RightButton(route: RouteType, navigator: Navigator) {
  if (route.rightButton) {
    if (route.rightButton === 'share') {
      return <ShareButton onPress={route.onRightButton || noop} />
    }

    return route.rightButton({
      contentContainerStyle: rightButtonStyles.button,
      style: rightButtonStyles.icon,
    })
  }

  if (route.onDismiss) {
    return <CloseScreenButton route={route} navigator={navigator} />
  }

  if (route.id === 'HomeView') {
    return <EditHomeButton route={route} navigator={navigator} />
  }
}
