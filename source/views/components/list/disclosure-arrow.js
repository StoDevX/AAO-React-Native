// @flow
import React from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import * as c from '../colors'
import Icon from 'react-native-vector-icons/Ionicons'

const arrowStyles = StyleSheet.create({
  wrapper: {
    marginLeft: 10,
  },
  icon: {
    color: c.iosDisabledText,
    fontSize: 20,
  },
})

export const DisclosureArrow = ({style}: {style?: any}) => {
  if (Platform.OS === 'android') {
    return null
  }

  return (
    <View style={[arrowStyles.wrapper, style]}>
      <Icon style={arrowStyles.icon} name='ios-arrow-forward' />
    </View>
  )
}
