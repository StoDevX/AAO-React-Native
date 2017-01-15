/**
 * @flow
 * Exports the Title component, for rendering the screen title
 */

import React from 'react'
import {Text, Dimensions, StyleSheet, Platform} from 'react-native'
import type {RouteType} from '../../types'

export function Title(route: RouteType) {
  return (
    <Text
      style={[styles.text, {maxWidth: Dimensions.get('window').width / 2.5}]}
      numberOfLines={1}
      ellipsizeMode='tail'
    >
      {route.title}
    </Text>
  )
}


const styles = StyleSheet.create({
  text: {
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
    fontSize: Platform.OS === 'ios' ? 17 : 20,
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    marginVertical: Platform.OS === 'ios' ? 12 : 14,
  },
})
