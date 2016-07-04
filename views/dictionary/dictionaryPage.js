/**
 * All About Olaf
 * Dictionary page view for individual term
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView,
  TouchableOpacity
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'

export default class DictionaryPageView extends React.Component {
  constructor() {
    super()
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="Dictionary"
      renderScene={this.renderScene.bind(this)}
    />
  }

  renderScene() {
    return (
      <View style={styles.container}>
        <Text>DictionaryPageView</Text>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
