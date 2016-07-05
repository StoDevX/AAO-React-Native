import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native'

import NavigatorScreen from './navigator-screen'
import * as c from './colors'

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.black,
  },
  buildingOpen: {
    height: 100,
    
  },
  buildingClosed: {
    borderColor: c.brickRed,
    opacity: 50,
  },
  name: {

  },
})

// PROPS: imageSrc, buildingOpen, name
export default class BuildingView extends React.Component {
  render() {
    return (
      <Image source={{uri: this.props.name}} style={styles.buildingOpen}/>
    )
  }
}
