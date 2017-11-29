// @flow
import * as React from 'react'
import {StyleSheet} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

const styles = StyleSheet.create({
  icon: {
    fontSize: 30,
  },
})

export const TabBarIcon = (icon: string) => ({
  tintColor,
  focused,
}: {
  tintColor: string,
  focused: boolean,
}) => (
  <Icon
    name={focused ? `ios-${icon}` : `ios-${icon}-outline`}
    style={[styles.icon, {color: tintColor}]}
  />
)
