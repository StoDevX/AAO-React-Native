/**
 * @flow
 * Exports the LeftButton side of the Navigator.NavBar
 */

import React from 'react'
import {Text, Platform, Navigator, StyleSheet} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../touchable'
import {OpenSettingsButton} from './special-settings'
import type {RouteType, NavStateType} from '../../types'

export function LeftButton(
  route: RouteType,
  navigator: Navigator,
  index: number,
  navState: NavStateType,
) {
  if (route.id === 'HomeView') {
    return <OpenSettingsButton route={route} navigator={navigator} />
  }

  if (route.onDismiss) {
    return null
  }

  if (index <= 0) {
    return null
  }

  const backTitle = navState.routeStack[index].backButtonTitle || navState.routeStack[index-1].title

  let contents = null
  if (Platform.OS === 'android') {
    contents = <Icon style={styles.backButtonIcon} name='md-arrow-back' />
  } else {
    contents = [
      <Icon key={0} style={styles.backButtonIcon} name='ios-arrow-back' />,
      <Text key={1} style={styles.backButtonText}>{backTitle}</Text>,
    ]
  }

  return (
    <Touchable
      borderless
      highlight={false}
      style={styles.backButton}
      onPress={() => navigator.pop()}
    >
      {contents}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 17,
    color: 'white',
  },
  backButtonIcon: {
    color: 'white',
    fontSize: Platform.OS === 'ios' ? 36 : 24,
    paddingVertical: Platform.OS === 'ios' ? 4 : 16,
    paddingLeft: Platform.OS === 'ios' ? 8 : 16,
    paddingRight: 6,
  },
})
