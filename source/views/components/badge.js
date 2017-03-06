// @flow
import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import * as c from '../components/colors'

type PropsType = {
  text: string,
  accentColor?: string,
  textColor?: string,
  style?: Number|Object|Array<Number|Object>,
  textStyle?: Number|Object|Array<Number|Object>,
};

let styles = StyleSheet.create({
  accessoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    alignSelf: 'center',
  },
  accessoryBadgeText: {
    color: c.white,
  },
})

export function Badge({
  text,
  style,
  textStyle,
  accentColor=c.goldenrod,
  textColor='hsl(26, 49%, 34%)',
}: PropsType) {
  const bgaccent = accentColor.replace('rgb', 'rgba').replace(')', ', 0.1)')

  return (
    <View style={[styles.accessoryBadge, style, {backgroundColor: bgaccent, borderColor: accentColor}]}>
      <Text style={[styles.accessoryBadgeText, textStyle, {color: textColor}]}>{text}</Text>
    </View>
  )
}
