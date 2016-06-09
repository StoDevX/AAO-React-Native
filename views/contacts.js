/**
 * All About Olaf
 * iOS Contact page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'

export default class ContactView extends React.Component {
  render() {
    return <NavigatorScreen
      {...this.props}
      title="Contact"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <Text>Contact</Text>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
