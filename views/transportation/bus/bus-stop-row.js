// @flow

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'
import type {FancyBusTimeListType} from './types'
import type moment from 'moment'
import * as c from '../../components/colors'

const TIME_FORMAT = 'h:mma'

let styles = StyleSheet.create({
  busWillSkipStopTitle: {
    color: c.iosDisabledText,
  },
  busWillSkipStopDetail: {},
  busWillSkipStopDot: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
  rowDetail: {
    flex: 1,
    marginLeft: 0,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'column',
  },
  notLastRowContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c8c7cc',
  },
  passedStopDetail: {

  },
  itemTitle: {
    color: c.black,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemDetail: {
    color: c.iosDisabledText,
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: 13,
    textAlign: 'left',
  },
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
  atStopTitle: {
    fontWeight: 'bold',
  },
  passedStopTitle: {
    color: c.iosDisabledText,
  },
})

export function BusStopRow({
  index,
  time,
  now,
  barColor,
  currentStopColor,
  isLastRow,
  place,
  times,
}: {
  index: number,
  time: moment,
  now: moment,
  barColor: string,
  currentStopColor: string,
  isLastRow: boolean,
  place: string,
  times: FancyBusTimeListType[]
}) {
  const afterStop = time && now.isAfter(time, 'minute')
  const atStop = time && now.isSame(time, 'minute')
  const beforeStop = !afterStop && !atStop && time !== false
  const skippingStop = time === false

  // To draw the bar, we draw a chunk of the bar, then we draw the dot, then
  // we draw the last chunk of the bar.
  const busLineProgressBar = (
    <View style={styles.barContainer}>
      <View style={[styles.bar, {backgroundColor: barColor}]} />
      <View
        style={[
          styles.dot,
          afterStop && [styles.passedStop, {borderColor: barColor, backgroundColor: barColor}],
          beforeStop && [styles.beforeStop, {borderColor: barColor}],
          atStop && [styles.atStop, {borderColor: currentStopColor}],
          skippingStop && styles.busWillSkipStopDot,
        ]}
      />
      <View style={[styles.bar, {backgroundColor: barColor}]} />
    </View>
  )

  // The bus line information is the stop name, and the times.
  const busLineInformation = (
    <View style={[
      styles.rowDetail,
      !isLastRow && styles.notLastRowContainer,
    ]}>
      <Text style={[
        styles.itemTitle,
        skippingStop && styles.busWillSkipStopTitle,
        afterStop && styles.passedStopTitle,
        atStop && styles.atStopTitle,
      ]}>
        {place}
      </Text>
      <Text
        style={[
          styles.itemDetail,
          skippingStop && styles.busWillSkipStopDetail,
        ]}
        numberOfLines={1}
      >
        {times
          .map(timeSet => timeSet[index])
          .map(time => time === false ? 'None' : time.format(TIME_FORMAT))
          .join(' • ')}
      </Text>
    </View>
  )

  return (
    <View style={styles.row}>
      {busLineProgressBar}
      {busLineInformation}
    </View>
  )
}
