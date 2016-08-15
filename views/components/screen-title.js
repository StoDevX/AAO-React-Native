/**
 * All About Olaf
 * iOS screen title
 */

import React from 'react'
import {StyleSheet, Text} from 'react-native'

const styles = StyleSheet.create({
  navigationText: {
    color: 'black',
    margin: 10,
    fontSize: 16,
    fontWeight: '600',
  },
})

export default function ScreenTitle({children, style}) {
  return (
    <Text
      style={[styles.navigationText, style]}
      numberOfLines={1}
      ellipsizeMode='tail'
    >
      {children}
    </Text>
  )
}
