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
import type {BuildingStatusType} from './types'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    borderWidth: 5,
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
    fontSize: 30,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
})

let borderColors = {
  open: styles.buildingOpen,
  almostClosed: styles.buildingAlmostClosed,
  closed: styles.buildingClosed,
}

type PropsType = {
  open: BuildingStatusType,
  image: number,
  name: string,
};
export default function BuildingView({open, image, name}: PropsType) {
  let borderColor = borderColors[open]

  return (
    <View style={[styles.container, borderColor]}>
      <Image
        source={image}
        style={{width: undefined, height: 100}}
        resizeMode='cover'
      >
        <Text style={styles.name}>{name}</Text>
      </Image>
    </View>
  )
}

BuildingView.propTypes = {
  image: React.PropTypes.number.isRequired,
  name: React.PropTypes.string.isRequired,
  open: React.PropTypes.oneOf(['open', 'almostClosed', 'closed']).isRequired,
}
