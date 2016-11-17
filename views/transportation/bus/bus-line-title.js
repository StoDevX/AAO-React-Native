// @flow
import React from 'react'
import {View, StyleSheet, Text} from 'react-native'

let styles = StyleSheet.create({
  busLineTitle: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8c7cc',
  },
  busLineTitleText: {
    color: 'rgb(113, 113, 118)',
  },
})

export function BusLineTitle({title}: {title: string}) {
  return (
    <View style={styles.busLineTitle}>
      <Text style={styles.busLineTitleText}>
        {title.toUpperCase()}
      </Text>
    </View>
  )
}
