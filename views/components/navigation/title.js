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
    ...Platform.select({
      ios: {
        fontFamily: 'System',
        fontSize: 17,
        fontWeight: '600',
        marginVertical: 11,
      },
      android: {
        fontFamily: 'sans-serif-light',
        fontSize: 20,
        fontWeight: '600',
        marginVertical: 14,
      },
    }),
  },
})
