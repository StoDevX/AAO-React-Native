// @flow
/**
 * All About Olaf
 * Bus Line list helper
 */

import React from 'react'
import {
  View,
} from 'react-native'
import BusStopView from './busStop'
import type {BusStopType} from './types'

export default function BusLineView({schedule}: {schedule: BusStopType[]}) {
  return (
    <View>
      {schedule.map((data, i) =>
        <BusStopView key={i} location={data.location} times={data.times} />)}
    </View>
  )
}
BusLineView.propTypes = {
  schedule: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
}
