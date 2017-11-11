// @flow
import React from 'react'
import * as c from '../../../components/colors'
import {View, StyleSheet, Platform} from 'react-native'
const isAndroid = Platform.OS === 'android'

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
    marginVertical: -10,
    borderRadius: 20,
    zIndex: 1,
  },
  skippingStop: {
    backgroundColor: c.transparent,
    borderColor: c.transparent,
  },
  passedStop: {
    height: 12,
    width: 12,
  },
  beforeStop: {
    borderWidth: 3,
    backgroundColor: c.white,
    height: 18,
    width: 18,
  },
  atStop: {
    height: 20,
    width: 20,
    borderColor: c.white,
    borderWidth: 3,
    backgroundColor: c.white,
  },
})

type Props = {|
  +afterStop: boolean,
  +atStop: boolean,
  +barColor: string,
  +beforeStop: boolean,
  +currentStopColor: string,
  +skippingStop: boolean,
  +isFirstChunk: boolean,
  +isLastChunk: boolean,
|}

export class ProgressChunk extends React.PureComponent<any, Props, void> {
  render() {
    const {
      afterStop,
      atStop,
      barColor,
      beforeStop,
      currentStopColor,
      skippingStop,
      isFirstChunk,
      isLastChunk,
    } = this.props

    // To draw the bar, we draw a chunk of the bar, then we draw the dot, then
    // we draw the last chunk of the bar.
    const startBarColor = isAndroid && isFirstChunk ? c.transparent : barColor
    const endBarColor = isAndroid && isLastChunk ? c.transparent : barColor

    return (
      <View style={styles.barContainer}>
        <View style={[styles.bar, {backgroundColor: startBarColor}]} />
        <View
          style={[
            styles.dot,
            afterStop && [
              styles.passedStop,
              {borderColor: barColor, backgroundColor: barColor},
            ],
            beforeStop && [styles.beforeStop, {borderColor: barColor}],
            atStop && [styles.atStop, {borderColor: currentStopColor}],
            skippingStop && styles.skippingStop,
          ]}
        />
        <View style={[styles.bar, {backgroundColor: endBarColor}]} />
      </View>
    )
  }
}
