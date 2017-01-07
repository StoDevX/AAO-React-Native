// @flow
import React from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import {Touchable} from '../touchable'
import noop from 'lodash/noop'
import * as c from './colors'
import Icon from 'react-native-vector-icons/Ionicons'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingLeft: 15,
    ...Platform.select({
      ios: {
        paddingVertical: 8,
        paddingRight: 8,
      },
      android: {
        paddingVertical: 16,
        paddingRight: 15,
      },
    }),
  },
})

const arrowStyles = StyleSheet.create({
  wrapper: {
    marginLeft: 10,
  },
  icon: {
    color: c.iosDisabledText,
    fontSize: 20,
  },
})

const DisclosureArrow = ({style}: {style?: any}) => {
  if (Platform.OS === 'android') {
    return null
  }

  return (
    <View style={[arrowStyles.wrapper, style]}>
      <Icon style={arrowStyles.icon} name='ios-arrow-forward' />
    </View>
  )
}

type PropsType = {
  children?: any,
  style?: any,
  contentContainerStyle?: any,
  arrowPosition?: 'center'|'top'|'none',
  fullWidth?: boolean,
  spacing?: {left?: number, right?: number},
  onPress?: () => any,
};
export function ListRow(props: PropsType) {
  const {
    style,
    contentContainerStyle,
    children,
    onPress,
    spacing: {left: leftSpacing = 15} = {},
    fullWidth=false,
  } = props

  const Component = onPress ? Touchable : View
  const callback = onPress || noop

  const arrowPosition = props.arrowPosition || (onPress ? 'center' : 'none')
  const arrowPositionStyle = {alignSelf: arrowPosition === 'center' ? 'center' : 'flex-start'}
  const arrow = arrowPosition === 'none' || Platform.OS === 'android'
    ? null
    : <DisclosureArrow style={arrowPositionStyle} />

  const spacing = {paddingLeft: fullWidth ? 0 : leftSpacing}

  return (
    <Component style={[styles.container, spacing, contentContainerStyle]} onPress={callback}>
      <View style={[{flex: 1}, style]}>
        {children}
      </View>
      {arrow}
    </Component>
  )
}
