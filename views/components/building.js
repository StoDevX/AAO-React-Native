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
  },
  buildingOpen: {
    height: 100,
    borderColor: c.pastelGreen,
    borderWidth: 5,
  },
  buildingClosed: {
    height: 100,
    borderColor: c.strawberry,
    borderWidth: 5,
  },
  name: {

  },
})

// PROPS: imageSrc, buildingOpen, name
export default class BuildingView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        {this.props.open ?
          <Image source={{uri: this.props.imageSource}} style={styles.buildingOpen}/> :
          <Image source={{uri: this.props.imageSource}} style={styles.buildingClosed}/>}
        <Text style={styles.name}>{this.props.name}</Text>
      </View>
    )
  }
}
