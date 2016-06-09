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
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
