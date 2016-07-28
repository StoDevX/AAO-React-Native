/**
 * All About Olaf
 * Map page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  WebView,
} from 'react-native'
import MapView from 'react-native-maps';

import NavigatorScreen from './components/navigator-screen'
import mapInfo from '../data/map.json'

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
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
         />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: 400,
    width: 400,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
