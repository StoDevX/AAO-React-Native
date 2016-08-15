// @flow
/**
 * All About Olaf
 * iOS Transportation page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'

export default class TransportationView extends React.Component {
  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <Text>Transportation</Text>
      </View>
    )
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='Transportation'
      renderScene={this.renderScene.bind(this)}
    />
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
