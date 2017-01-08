// @flow
import React from 'react'
import {View, Text, StyleSheet} from 'react-native'

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingBottom: 4,
    backgroundColor: 'white',
    borderRadius: 2,
    elevation: 2,
  },
  title: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  titleText: {
    color: 'rgb(113, 113, 118)',
    fontWeight: 'bold',
  },
  contentWrapper: {
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 6,
    paddingBottom: 2,
  },
  footerText: {
  },
})

export function Card({header, footer, children, style}: {header?: string, footer?: string, children?: any, style?: any}) {
  return (
    <View style={[cardStyles.card, style]}>
      <View style={cardStyles.title}>
        <Text style={cardStyles.titleText}>{header}</Text>
      </View>

      <View style={cardStyles.contentWrapper}>
        {children}
      </View>

      {footer
        ? <View style={cardStyles.footer}>
          <Text style={cardStyles.footerText}>{footer}</Text>
        </View>
        : null}
    </View>
  )
}
