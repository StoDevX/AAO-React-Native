// @flow
import * as React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
  container: {
    paddingLeft: 15,
    ...Platform.select({
      ios: {
        backgroundColor: c.iosListSectionHeader,
        paddingVertical: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.iosHeaderTopBorder,
        borderBottomColor: c.iosHeaderBottomBorder,
        paddingRight: 10,
      },
      android: {
        backgroundColor: 'white',
        paddingTop: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
        borderBottomWidth: 0,
        borderColor: '#c8c7cc',
        paddingRight: 15,
      },
    }),
  },
  bold: {
    ...Platform.select({
      ios: {fontWeight: '500'},
      android: {fontWeight: '600'},
    }),
  },
  title: {
    fontWeight: '400',
    ...Platform.select({
      ios: {
        fontSize: 16,
        color: c.black,
      },
      android: {
        fontSize: 16,
        fontFamily: 'sans-serif-condensed',
        color: c.tint,
      },
    }),
  },
  subtitle: {
    fontWeight: '400',
    ...Platform.select({
      ios: {
        fontSize: 16,
        color: c.iosDisabledText,
      },
      android: {
        fontSize: 16,
        fontFamily: 'sans-serif-condensed',
        color: c.iosDisabledText, // todo: find android equivalent
      },
    }),
  },
})

type PropsType = {
  title: string,
  bold?: boolean,
  titleStyle?: any,
  subtitle?: string,
  subtitleStyle?: any,
  separator?: string,
  style?: any,
  spacing?: {left?: number, right?: number},
}
export function ListSectionHeader(props: PropsType) {
  const {
    style,
    title,
    bold = true,
    titleStyle,
    subtitle = null,
    subtitleStyle,
    separator = ' — ',
    spacing: {left: leftSpacing = 15} = {},
  } = props

  return (
    <View style={[styles.container, {paddingLeft: leftSpacing}, style]}>
      <Text>
        <Text style={[styles.title, titleStyle, bold ? styles.bold : null]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, subtitleStyle]}>
            {separator}
            {subtitle}
          </Text>
        ) : null}
      </Text>
    </View>
  )
}
