/**
 * All About Olaf
 * iOS screen title
 */

import React from 'react'
import {StyleSheet, Dimensions, Text} from 'react-native'

const styles = StyleSheet.create({
  navigationText: {
    color: 'black',
    margin: 10,
    fontSize: 16,
    fontWeight: '600',
  },
})

let width = Dimensions.get('window').width

export default function ScreenTitle({children, style}) {
  if (children.length > 15) {
    children = children.substring(0, (width/15)) + '…'
  }
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
ScreenTitle.propTypes = {
  children: React.PropTypes.node.isRequired,
  style: React.PropTypes.number,
}
