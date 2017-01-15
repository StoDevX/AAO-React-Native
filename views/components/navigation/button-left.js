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
    contents = <Icon style={styles.icon} name='md-arrow-back' />
  } else {
    contents = [
      <Icon key={0} style={styles.icon} name='ios-arrow-back' />,
      <Text key={1} style={styles.text}>{backTitle}</Text>,
    ]
  }

  return (
    <Touchable
      borderless
      highlight={false}
      style={styles.button}
      onPress={() => navigator.pop()}
    >
      {contents}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 17,
    color: 'white',
    ...Platform.select({
      ios: {
        marginTop: -1,
      },
    }),
  },
  icon: {
    color: 'white',
    paddingRight: 6,
    ...Platform.select({
      ios: {
        fontSize: 36,
        paddingVertical: 4,
        paddingLeft: 8,
        marginTop: 3,
      },
      android: {
        fontSize: 24,
        paddingVertical: 16,
        paddingLeft: 16,
      },
    }),
  },
})
