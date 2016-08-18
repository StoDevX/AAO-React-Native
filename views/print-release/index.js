// @flow
/**
 * All About Olaf
 * stoPrint web release page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  WebView,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import stoPrintInfo from '../../data/print-release.json'

export default class PrintReleaseView extends React.Component {
  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <WebView
          source={{uri: stoPrintInfo.url}}
          startInLoadingState={true}
          style={styles.container}
        />
      </View>
    )
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='stoPrint'
      renderScene={this.renderScene.bind(this)}
    />
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
})
