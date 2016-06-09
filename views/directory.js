/**
 * All About Olaf
 * iOS Directory page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'
import NavigatorScreen from './components/navigator-screen'
import queryStalkernet from '../lib/stalkernet'

export default class DirectoryView extends React.Component {
  render() {
    return <NavigatorScreen
      {...this.props}
      title="Directory"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <Text>Directory</Text>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
