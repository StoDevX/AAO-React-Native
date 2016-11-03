/**
 * All About Olaf
 * Individual row for inside a collapsible view
 */

import React from 'react'
import {View} from 'react-native'

export default function Collapsible({
  children,
  collapsed,
  style,
}: {
  children: array,
  collapsed: boolean,
  style: object,
}) {
  if (collapsed) {
    return null
  }

  return (
    <View style={style}>
      {children}
    </View>
  )
}
