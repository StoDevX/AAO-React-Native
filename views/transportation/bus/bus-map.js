// @flow

import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  MapView,
} from 'react-native'
import type {BusScheduleType} from './types'

export default function BusMapView({pairs}: {pairs: [string, string, [number, number]][]}) {
  // console.error(pairs)
  return (
    <MapView
      style={{height: 200, margin: 40}}
      showsUserLocation={true}
      annotations={pairs.map(([place, time, [latitude, longitude]]) => ({title: place, latitude, longitude}))}
      region={{
        latitude: 44.45,
        longitude: -93.175,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    />
  )
}
BusMapView.propTypes = {
  pairs: React.PropTypes.array.isRequired,
}
