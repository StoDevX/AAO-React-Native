/**
 * All About Olaf
 * iOS Map page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  MapView,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'
import mapCoordinates from '../data/map-coordinates.json'

export default class OlafMapView extends React.Component {
  render() {
    return <NavigatorScreen
      {...this.props}
      title="Map"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <Text>Map</Text>
        <MapView
          style={styles.map}
          pitchEnabled={false}
          rotateEnabled={false}
          //scrollEnabled={false}
          region={{
            // center on dittmann
            latitude: 44.46271,
            longitude: -93.184158,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          mapType={'hybrid'}
          annotations={mapCoordinates}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  }
})
