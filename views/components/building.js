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

import NavigatorScreen from './navigator-screen'
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

// PROPS: imageSrc, open, name
export default class BuildingView extends React.Component {
  render() {
    switch (this.props.open) {
      case 'open':
        return (
          <View style={styles.container}>
            <Image source={{uri: this.props.imageSource}} style={styles.buildingOpen}>
              <Text style={styles.name}>{this.props.name}</Text>
              </Image>
          </View>
        )
        break
      case 'almostClosed':
        return (
          <View style={styles.container}>
            <Image source={{uri: this.props.imageSource}} style={styles.buildingAlmostClosed}>
              <Text style={styles.name}>{this.props.name}</Text>
              </Image>
          </View>
        )
        break
      case 'closed':
        return (
          <View style={styles.container}>
            <Image source={{uri: this.props.imageSource}} style={styles.buildingClosed}>
              <Text style={styles.name}>{this.props.name}</Text>
              </Image>
          </View>
        )
        break
      default:
        return (
          <View></View>
        )
        break
    }
  }
}
