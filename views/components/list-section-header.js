// @flow
import React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import * as c from './colors'

const styles = StyleSheet.create({
  container: {
    paddingLeft: 15,
    ...Platform.select({
      ios: {
        backgroundColor: c.iosListSectionHeader,
        paddingVertical: 5,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: '#ebebeb',
        paddingRight: 6,
      },
      android: {
        backgroundColor: 'white',
        paddingTop: 10,
        paddingBottom: 15,
        borderTopWidth: 1,
        borderBottomWidth: 0,
        borderColor: '#c8c7cc',
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

type PropsType = {
  title: string,
  bold?: boolean,
  titleStyle?: any,
  subtitle?: string,
  subtitleStyle?: any,
  separator?: string,
  style?: any,
};
export function ListSectionHeader(props: PropsType) {
  const {
    style,
    title,
    bold=true,
    titleStyle,
    subtitle=null,
    subtitleStyle,
    separator=' — ',
  } = props

  return (
    <View style={[styles.container, style]}>
      <Text>
        <Text style={[styles.title, titleStyle, bold ? styles.bold : null]}>{title}</Text>
        <Text style={[styles.subtitle, subtitleStyle]}>{separator}{subtitle}</Text>
      </Text>
    </View>
  )
}
