// @flow
import React from 'react'
import {Platform, StyleSheet, View, Text} from 'react-native'
import {Touchable} from '../touchable'
import {DisclosureArrow} from './disclosure-arrow'
import noop from 'lodash/noop'
import isNil from 'lodash/isNil'
import * as c from '../colors'
// import * as Row from './modes'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingLeft: 15,
    backgroundColor: 'white',
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
  fullWidth: {
    paddingLeft: 0,
  },
  fullHeight: {
    paddingVertical: 0,
  },

  title: {
    // paddingLeft: 0,
    // paddingRight: 0,
    fontSize: Platform.OS === 'ios' ? 16 : 17,
  },
  description: {
    color: c.iosDisabledText,
    paddingTop: 3,
    // paddingLeft: 0,
    // paddingRight: 0,
    fontSize: 13,
  },
})

type Props222Type = {children?: any, style?: any};
const Row = ({children, style}: Props222Type) =>
  <View style={[{flexDirection: 'row'}, style]}>{children}</View>
const Column = ({children, style}: Props222Type) =>
  <View style={[{flexDirection: 'column'}, style]}>{children}</View>

function makeContents(props: PropsType) {
  const {
    title,
    titleLines,
    titleStyle,
    description,
    descriptionLines,
    descriptionStyle,
    badge,
    leftColumn,
    rightColumn,
  } = props

  const hasDescription = Boolean(description)

  let titleEl = title
  if (typeof title === 'string') {
    titleEl = (
      <Text
        style={[styles.title, titleStyle]}
        numberOfLines={titleLines}
      >
        {title}
      </Text>
    )
  }

  let descriptionEl = null
  if (typeof description === 'string' && hasDescription) {
    descriptionEl = (
      <Text
        style={[styles.description, descriptionStyle]}
        numberOfLines={descriptionLines}
      >
        {description}
      </Text>
    )
  } else if (hasDescription) {
    descriptionEl = description
  }

  return (
    <Row>
      {badge}
      {leftColumn}
      <Column style={{flex: 1}}>
        {titleEl}
        {descriptionEl}
      </Column>
      {rightColumn}
    </Row>
  )
}

type PropsType = {
  style?: any,
  contentContainerStyle?: any,
  arrowPosition?: 'center'|'top'|'none',
  fullWidth?: boolean,
  fullHeight?: boolean,
  spacing?: {left?: number, right?: number},
  onPress?: () => any,

  // children?: any,

  title: string|React$Element<*>|Array<React$Element<any>|string>,
  titleLines?: number,
  titleStyle?: any,

  description?: string|React$Element<any>|Array<React$Element<any>|string>,
  descriptionLines?: number,
  descriptionStyle?: any,

  badge?: React$Element<any>|Array<React$Element<any>>,
  leftColumn?: React$Element<any>|Array<React$Element<any>>,
  rightColumn?: React$Element<any>|Array<React$Element<any>>,
};
export function ListRow(props: PropsType) {
  const {
    style,
    contentContainerStyle,
    // children,
    onPress,
    spacing: {left: leftSpacing = 15, right: rightSpacing = null} = {},
    fullWidth=false,
    fullHeight=false,
  } = props

  const Component = onPress ? Touchable : View
  const callback = onPress || noop

  const contents = /*children ||*/ makeContents(props)

  const arrowPosition = props.arrowPosition || (onPress ? 'center' : 'none')
  const arrowPositionStyle = {alignSelf: arrowPosition === 'center' ? 'center' : 'flex-start'}
  const arrow = arrowPosition === 'none' || Platform.OS === 'android'
    ? null
    : <DisclosureArrow style={arrowPositionStyle} />

  return (
    <Component
      style={[
        styles.container,
        !isNil(leftSpacing) && {paddingLeft: leftSpacing},
        !isNil(rightSpacing) && {paddingRight: rightSpacing},
        fullWidth && styles.fullWidth,
        fullHeight && styles.fullHeight,
        contentContainerStyle,
      ]}
      onPress={callback}
    >
      <View style={[{flex: 1}, style]}>
        {contents}
      </View>
      {arrow}
    </Component>
  )
}
