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
export default function BuildingView({open}: {open: 'open'|'closed'|'almostClosed'}) {
  let imageStyle = imageStyles[open]

  return (
    <View style={styles.container}>
      <Image source={{uri: this.props.imageSource}} style={imageStyle}>
        <Text style={styles.name}>{this.props.name}</Text>
      </Image>
    </View>
  )
}

BuildingView.propTypes = {
  open: React.PropTypes.oneOf(['open', 'almostClosed', 'closed']).isRequired,
}
