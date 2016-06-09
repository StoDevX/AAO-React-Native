/**
 * All About Olaf
 * iOS Map page
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
const URL = mapInfo['url']

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
        <WebView
          automaticallyAdjustContentInsets={false}
          style={styles.map}
          source={{url: URL}}
          javaScriptEnabled={false}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest.bind(this)}
          startInLoadingState={true}
          scalesPageToFit={this.scalesPageToFit}
        />
      </View>
    )
  }

  onShouldStartLoadWithRequest() {
    return true
  }

  onNavigationStateChange(navState) {
    this.url = navState.url
    this.scalesPageToFit = true
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
})
