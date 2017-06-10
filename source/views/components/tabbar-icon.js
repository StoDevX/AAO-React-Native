// @flow
// eslint-disable react-native/no-inline-styles
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons'

export const TabBarIcon = (icon: string) => ({
  tintColor,
  focused,
}: {
  tintColor: string,
  focused: boolean,
}) =>
  <Icon
    style={[{color: tintColor, fontSize: 30}]}
    name={focused ? `ios-${icon}` : `ios-${icon}-outline`}
  />
