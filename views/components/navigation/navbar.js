/**
 * @flow
 * Exports a Navigator.NavBar component with predefined buttons
 */

import React from 'react'
import {Navigator, StyleSheet, Platform} from 'react-native'
import * as c from '../colors'
import {Title} from './title'
import {LeftButton} from './button-left'
import {RightButton} from './button-right'

export function NavigationBar() {
  return (
    <Navigator.NavigationBar
      style={styles.navigationBar}
      routeMapper={{
        LeftButton,
        RightButton,
        Title,
      }}
    />
  )
}

const styles = StyleSheet.create({
  navigationBar: {
    backgroundColor: c.olevilleGold,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: StyleSheet.hairlineWidth },
        shadowColor: 'rgb(100, 100, 100)',
        shadowOpacity: 0.5,
        shadowRadius: StyleSheet.hairlineWidth,
      },
      android: {
        elevation: 4,
      },
    }),
  },
})
