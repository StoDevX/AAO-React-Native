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

import NavigatorScreen from './components/navigator-screen'
import mapInfo from '../data/map.json'

export default class OlafMapView extends React.Component {
  render() {
    return <NavigatorScreen
      {...this.props}
      title='Map'
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <WebView
          source={{uri: mapInfo.url}}
          startInLoadingState={true}
          style={styles.container}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
