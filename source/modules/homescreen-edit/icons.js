// @flow
import React from 'react'
import {StyleSheet, Platform} from 'react-native'
import * as c from '../../components/colors'
import type {VisibleHomescreenViewType} from '../../app/types'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import IonIcon from 'react-native-vector-icons/Ionicons'

export const ReorderIcon = () =>
  <IonIcon
    name={Platform.OS === 'ios' ? 'ios-reorder' : 'md-reorder'}
    size={32}
    style={styles.listButtonIcon}
  />

type MenuIconProps = {view: VisibleHomescreenViewType}
export const MenuIcon = ({view: {icon, tint}}: MenuIconProps) =>
  <EntypoIcon
    name={icon}
    size={32}
    style={[styles.rectangleButtonIcon, {color: tint}]}
  />

let styles = StyleSheet.create({
  rectangleButtonIcon: {
    marginRight: 20,
    color: c.white,
    paddingLeft: 10,
    paddingRight: 10,
  },
  listButtonIcon: {
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
  },
})
