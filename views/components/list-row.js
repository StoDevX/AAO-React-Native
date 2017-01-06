// @flow
import React from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import {Touchable} from './touchable'
import identity from 'lodash/identity'
import * as c from './colors'
import Icon from 'react-native-vector-icons/Ionicons'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginLeft: 15,
    ...Platform.select({
      ios: {
        paddingVertical: 8,
        paddingRight: 6,
      },
      android: {
        paddingVertical: 16,
        paddingRight: 15,
      },
    }),
  },
  bold: {
    fontWeight: 'bold',
  },
  title: {
    ...Platform.select({
      ios: {
        color: c.black,
        fontWeight: '400',
      },
      android: {
        color: c.tint,
        fontWeight: '500',
      },
    }),
  },
  sectionHeaderSubtitle: {
    fontSize: 13,
    color: c.iosDisabledText,  // todo: find android equivalent
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

const DisclosureArrow = () => {
  if (Platform.OS === 'android') {
    return null
  }

  return (
    <View style={arrowStyles.wrapper}>
      <Icon style={arrowStyles.icon} name='ios-arrow-forward' />
    </View>
  )
}

type PropsType = {
  children?: any,
  style?: any,
  arrowPosition?: 'center'|'top'|'none',
  fullWidth?: boolean,
  spacing?: {left?: number, right?: number},
  onPress?: () => any,
};
export function ListRow(props: PropsType) {
  const {
    style,
    children,
    onPress,
    fullWidth=false,
  } = props

  const Component = onPress ? Touchable : View
  const callback = onPress || identity

  const arrowPosition = props.arrowPosition || (onPress ? 'center' : 'none')
  const arrowPositionStyle = {alignItems: arrowPosition === 'center' ? 'center' : 'flex-start'}
  const spacing = fullWidth ? {marginLeft: 0} : {marginLeft: 15}

  return (
    <Component style={[styles.container, spacing, arrowPositionStyle, style]} onPress={callback}>
      <View>
        {children}
      </View>
      {arrowPosition !== 'none' ? <DisclosureArrow /> : null}
    </Component>
  )
}
