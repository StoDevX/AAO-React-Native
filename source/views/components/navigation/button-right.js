/**
 * @flow
 * Exports the RightButton side of the Navigator.NavBar
 */

import React from 'react'
import {Navigator, Platform, StyleSheet} from 'react-native'
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

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    ...Platform.select({
      ios: {
        paddingRight: 16,
        marginTop: 7,
      },
      android: {
        paddingVertical: 16,
        paddingRight: 16,
      },
    }),
  },
  icon: {
    color: 'white',
    ...Platform.select({
      ios: {
        fontSize: 26,
      },
      android: {
        fontSize: 24,
      },
    }),
  },
})
