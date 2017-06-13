// @flow

import React from 'react'
import {Text, StyleSheet, Platform, Dimensions} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'

const Viewport = Dimensions.get('window')

export function HomeScreenButton({
  view,
  onPress,
}: {
  view: ViewType,
  onPress: () => any,
}) {
  return (
    <Touchable
      highlight={false}
      onPress={onPress}
      style={[styles.rectangle, {backgroundColor: view.tint}]}
    >
      <Icon name={view.icon} size={32} style={styles.rectangleButtonIcon} />
      <Text style={styles.rectangleButtonText}>
        {view.title}
      </Text>
    </Touchable>
  )
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4
const cellWidth = Viewport.width / 2 - CELL_MARGIN * 1.5

const styles = StyleSheet.create({
  // Main buttons for actions on home screen
  rectangle: {
    width: cellWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: cellVerticalPadding,
    paddingBottom: cellVerticalPadding / 2,
    paddingHorizontal: cellHorizontalPadding,
    borderRadius: Platform.OS === 'ios' ? 6 : 3,
    elevation: 2,

    marginTop: CELL_MARGIN / 2,
    marginBottom: CELL_MARGIN / 2,
    marginLeft: CELL_MARGIN / 2,
    marginRight: CELL_MARGIN / 2,
  },

  // Text styling in buttons
  rectangleButtonIcon: {
    color: c.white,
  },
  rectangleButtonText: {
    color: c.white,
    marginTop: cellVerticalPadding / 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
    textAlign: 'center',
    fontSize: 14,
  },
})
