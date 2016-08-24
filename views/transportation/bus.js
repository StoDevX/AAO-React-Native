// @flow
/**
 * All About Olaf
 * Bus tab of the transportation page
 */

import React from 'react'
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
} from 'react-native'
import busInfo from '../../data/bus-times.json'
import type {BusLineType} from './types'
import BusLineView from './busLine'

let styles = StyleSheet.create({
  container: {
  },
  busLine: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 10,
  },
})

export default function BusView() {
  return (
    <ScrollView contentInset={{bottom: 49}} automaticallyAdjustContentInsets={false}>
      {busInfo.map((busLine: BusLineType) =>
        <View key={busLine.line}>
          <Text style={styles.busLine}>{busLine.line}</Text>
          <BusLineView schedule={busLine.schedule} />
        </View>
      )}
    </ScrollView>
  )
}
