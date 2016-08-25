// @flow
/**
 * All About Olaf
 * Building Hours list element
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native'

import * as c from '../components/colors'
import type {BuildingInfoType} from './types'
import {isBuildingOpen} from './is-building-open'
import {formatBuildingHours} from './format-building-hours'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    margin: 5,
    height: 100,
  },
  buildingOpen: {
    borderColor: c.pastelGreen,
  },
  buildingClosed: {
    borderColor: c.strawberry,
  },
  buildingAlmostClosed: {
    borderColor: c.mustard,
  },
  name: {
    color: c.white,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  inner: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  status: {
    color: c.white,
    fontSize: 14,
    paddingTop: 2,
    paddingBottom: 2,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
})

let borderColors = {
  'Open': styles.buildingOpen,
  'Almost Closed': styles.buildingAlmostClosed,
  'Closed': styles.buildingClosed,
}

type PropsType = {
  info: BuildingInfoType,
  image: number,
  name: string,
};
export default function BuildingView({info, image, name}: PropsType) {
  let open = isBuildingOpen(info)
  let borderColor = borderColors[open]
  let hours = formatBuildingHours(info)

  return (
    <View style={[styles.container, borderColor]}>
      <Image
        source={image}
        style={{width: undefined, height: 100}}
        resizeMode='cover'
      >
        <View style={styles.inner}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.status}>{hours}</Text>
        </View>
      </Image>
    </View>
  )
}

BuildingView.propTypes = {
  image: React.PropTypes.number.isRequired,
  info: React.PropTypes.object.isRequired,
  name: React.PropTypes.string.isRequired,
}
