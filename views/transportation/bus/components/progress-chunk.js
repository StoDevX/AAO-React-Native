// @flow
import React from 'react'
import {View, StyleSheet} from 'react-native'

const styles = StyleSheet.create({
  barContainer: {
    paddingRight: 5,
    width: 45,
    flexDirection: 'column',
    alignItems: 'center',
  },
  bar: {
    flex: 1,
    width: 5,
  },
  dot: {
    height: 15,
    width: 15,
    marginTop: -20,
    marginBottom: -20,
    borderRadius: 20,
    zIndex: 1,
  },
  skippingStop: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  passedStop: {
    height: 12,
    width: 12,
  },
  beforeStop: {
    borderWidth: 3,
    backgroundColor: 'white',
    height: 18,
    width: 18,
  },
  atStop: {
    height: 20,
    width: 20,
    borderColor: 'white',
    borderWidth: 3,
    backgroundColor: 'white',
  },
})

export const ProgressChunk = ({afterStop, atStop, barColor, beforeStop, currentStopColor, skippingStop}: {
  afterStop: boolean,
  atStop: boolean,
  barColor: string,
  beforeStop: boolean,
  currentStopColor: string,
  skippingStop: boolean,
}) => {
  // To draw the bar, we draw a chunk of the bar, then we draw the dot, then
  // we draw the last chunk of the bar.
  return (
    <View style={styles.barContainer}>
      <View style={[styles.bar, {backgroundColor: barColor}]} />
      <View style={[
        styles.dot,
        afterStop && [styles.passedStop, {borderColor: barColor, backgroundColor: barColor}],
        beforeStop && [styles.beforeStop, {borderColor: barColor}],
        atStop && [styles.atStop, {borderColor: currentStopColor}],
        skippingStop && styles.skippingStop,
      ]} />
      <View style={[styles.bar, {backgroundColor: barColor}]} />
    </View>
  )
}
