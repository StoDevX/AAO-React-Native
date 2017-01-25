/**
 * @flow
 * A component extracted from react-native-tableview-simple, to render an iOS checkmark
 */

import React from 'react'
import {View, StyleSheet} from 'react-native'
import * as c from './colors'

export function Checkmark({transparent}: {transparent: boolean}) {
  return <View style={[styles.checkmark, transparent && styles.hidden]} />
}

const styles = StyleSheet.create({
  checkmark: {
    width: 13,
    height: 6,
    marginLeft: 7,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: c.tableviewAccessoryColor,
    transform: [{
      rotate: '-45deg',
    }],
  },
  hidden: {
    borderColor: 'transparent',
  },
})
