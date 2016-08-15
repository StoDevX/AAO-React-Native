/**
 * All About Olaf
 * iOS About page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'

export default class AboutView extends React.Component {
  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <Text>About</Text>
      </View>
    )
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='About'
      renderScene={this.renderScene.bind(this)}
    />
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
