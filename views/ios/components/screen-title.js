/**
 * All About Olaf
 * iOS screen title
 */

import React from 'react'
import {StyleSheet, Text} from 'react-native'

const styles = StyleSheet.create({
  navigationText: {
    color: 'white',
    margin: 10,
    fontSize: 16,
    fontWeight: '600',
  },
})

export default ({children, style}) =>
  <Text style={[styles.navigationText, style]}>
    {children}
  </Text>
