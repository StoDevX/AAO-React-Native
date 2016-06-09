/**
 * All About Olaf
 * iOS Dictionary page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'

export default class DictionaryView extends React.Component {
  render() {
    return <NavigatorScreen
      {...this.props}
      title="Dictionary"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <Text>Dictionary</Text>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
