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
  render() {
    return <NavigatorScreen
      {...this.props}
      title='About'
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <Text>About</Text>
      </View>
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
