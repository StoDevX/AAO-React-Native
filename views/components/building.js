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

import * as c from './colors'
import type {BuildingStatusType} from '../building-hours'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    margin: 5,
  },
  buildingOpen: {
    height: 100,
    borderColor: c.pastelGreen,
    borderWidth: 5,
    flex: 1,
  },
  buildingClosed: {
    height: 100,
    borderColor: c.strawberry,
    borderWidth: 5,
    flex: 1,
  },
  buildingAlmostClosed: {
    height: 100,
    borderColor: c.mustard,
    borderWidth: 5,
    flex: 1,
  },
  name: {
    color: c.white,
    fontSize: 30,
    textAlign: 'center',
  },
})

let imageStyles = {
  open: styles.buildingOpen,
  almostClosed: styles.buildingAlmostClosed,
  closed: styles.buildingClosed,
}

// PROPS: imageSrc, open, name
type PropsType = {
  open: BuildingStatusType,
  imageSource: string,
  name: string,
};
export default function BuildingView({open, imageSource, name}: PropsType) {
  let imageStyle = imageStyles[open]

  return (
    <View style={styles.container}>
      <Image source={{uri: imageSource}} style={imageStyle}>
        <Text style={styles.name}>{name}</Text>
      </Image>
    </View>
  )
}

BuildingView.propTypes = {
  imageSource: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  open: React.PropTypes.oneOf(['open', 'almostClosed', 'closed']).isRequired,
}
