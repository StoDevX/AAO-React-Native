// @flow

import * as React from 'react'
import {Text, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import LinearGradient from 'react-native-linear-gradient'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'

type Props = {
  view: ViewType,
  onPress: () => any,
}

export function HomeScreenButton({view, onPress}: Props) {
  const style = {backgroundColor: view.tint}

  if (view.gradient) {
    return (
      <Touchable onPress={onPress}>
        <LinearGradient
          colors={view.gradient}
          end={{x: 1, y: 0.85}}
          start={{x: 0, y: 0.05}}
          style={[styles.rectangle]}
        >
          <Icon name={view.icon} size={32} style={styles.rectangleButtonIcon} />
          <Text style={styles.rectangleButtonText}>{view.title}</Text>
        </LinearGradient>
      </Touchable>
    )
  }

  return (
    <Touchable
      accessibilityComponentType="button"
      accessibilityLabel={view.title}
      accessibilityTraits="button"
      highlight={false}
      onPress={onPress}
      style={[styles.rectangle, style]}
    >
      <Icon name={view.icon} size={32} style={styles.rectangleButtonIcon} />
      <Text style={styles.rectangleButtonText}>{view.title}</Text>
    </Touchable>
  )
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
  // Main buttons for actions on home screen
  rectangle: {
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
    backgroundColor: c.transparent,
  },
  rectangleButtonText: {
    color: c.white,
    backgroundColor: c.transparent,
    // marginTop: cellVerticalPadding / 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
    // textAlign: 'center',
    fontSize: 14,
  },
})
