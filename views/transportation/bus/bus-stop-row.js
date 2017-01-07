// @flow
import React from 'react'
import {Platform, View, StyleSheet, Text} from 'react-native'
import type {FancyBusTimeListType} from './types'
import type moment from 'moment'
import * as c from '../../components/colors'
import {BusProgressBar} from './bus-progress-bar'

const TIME_FORMAT = 'h:mma'

const styles = StyleSheet.create({
  busWillSkipStopTitle: {
    color: c.iosDisabledText,
  },
  busWillSkipStopDetail: {
  },
  row: {
    flexDirection: 'row',
  },
  rowDetail: {
    flex: 1,
    marginLeft: 0,
    paddingRight: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 15,
    flexDirection: 'column',
  },
  notLastRowContainer: {
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderBottomColor: Platform.OS === 'ios' ? '#c8c7cc' : '#e0e0e0',
  },
  passedStopDetail: {
  },
  itemTitle: {
    color: c.black,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 3,
    fontSize: Platform.OS === 'ios' ? 16 : 17,
    textAlign: 'left',
  },
  itemDetail: {
    color: c.iosDisabledText,
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: 13,
    textAlign: 'left',
  },
  atStopTitle: {
    fontWeight: 'bold',
  },
  passedStopTitle: {
    color: c.iosDisabledText,
  },
})

export function BusStopRow({index, time, now, barColor, currentStopColor, isLastRow, place, times}: {
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

  return (
    <View style={styles.row}>
      <BusProgressBar {...{barColor, afterStop, beforeStop, atStop, skippingStop, currentStopColor}} />
      <BusLineInformation {...{afterStop, atStop, index, isLastRow, place, skippingStop, times}} />
    </View>
  )
}

const BusLineInformation = ({afterStop, atStop, index, isLastRow, place, skippingStop, times}: {
  afterStop: boolean,
  atStop: boolean,
  index: number,
  isLastRow: boolean,
  place: string,
  skippingStop: boolean,
  times: FancyBusTimeListType[],
}) => {
  // The bus line information is the stop name, and the times.
  return (
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
      <BusDetail times={times} index={index} skipping={skippingStop} />
    </View>
  )
}

const BusDetail = ({index, times, skipping}: {
  index: number,
  skipping: boolean,
  times: FancyBusTimeListType[],
}) => {
  return (
    <Text
      style={[
        styles.itemDetail,
        skipping && styles.busWillSkipStopDetail,
      ]}
      numberOfLines={1}
    >
      {times
        .map(timeSet => timeSet[index])
        .map(time => time === false ? 'None' : time.format(TIME_FORMAT))
        .join(' • ')}
    </Text>
  )
}
