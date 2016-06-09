/**
 * All About Olaf
 * iOS Dictionary page
 */
'use strict'

// React native
const React = require('react')
const RN = require('react-native')
const NavigatorScreen = require('./components/navigator-screen')

const {
  StyleSheet,
  View,
  Text,
} = RN

class DictionaryView extends React.Component {
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

module.exports = DictionaryView
