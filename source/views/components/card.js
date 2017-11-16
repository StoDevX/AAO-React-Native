// @flow
import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import * as c from './colors'

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingBottom: 4,
    backgroundColor: c.white,
    borderRadius: 2,
    elevation: 2,
  },
  title: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  titleText: {
    color: c.androidTextColor,
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: c.androidSeparator,
    paddingTop: 6,
    paddingBottom: 2,
  },
})

export function Card({
  header,
  footer,
  children,
  style,
}: {
  header?: string,
  footer?: string,
  children?: any,
  style?: any,
}) {
  return (
    <View style={[cardStyles.card, style]}>
      {header ? (
        <View style={cardStyles.title}>
          <Text selectable={true} style={cardStyles.titleText}>
            {header}
          </Text>
        </View>
      ) : null}

      <View>{children}</View>

      {footer ? (
        <View style={cardStyles.footer}>
          <Text selectable={true}>{footer}</Text>
        </View>
      ) : null}
    </View>
  )
}
