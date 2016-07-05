/**
 * All About Olaf
 * iOS BuildingHours page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'
import BuildingView from './components/building'

export default class BuildingHoursView extends React.Component {
  render() {
    return <NavigatorScreen
      {...this.props}
      title="Building Hours"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <BuildingView name={'https://placehold.it/1000x1000'} />
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
