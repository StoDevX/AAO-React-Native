// @flow
import React from 'react'
import {Platform, View, StyleSheet, Text} from 'react-native'

const styles = StyleSheet.create({
  busLineTitle: {
    paddingVertical: Platform.OS === 'ios' ? 5 : 15,
    paddingLeft: 15,
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderColor: '#c8c7cc',
  },
  busLineTitleText: {
    color: 'rgb(113, 113, 118)',
    fontWeight: Platform.OS === 'ios' ? 'normal' : 'bold',
  },
})

export function LineTitle({title, androidColor}: {title: string, androidColor: string}) {
  title = Platform.OS === 'ios'
    ? title.toUpperCase()
    : title
  return (
    <View style={styles.busLineTitle}>
      <Text style={[styles.busLineTitleText, Platform.OS === 'ios' ? null : {color: androidColor}]}>
        {title}
      </Text>
    </View>
  )
}
