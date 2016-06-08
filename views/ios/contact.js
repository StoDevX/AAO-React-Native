/**
 * All About Olaf
 * iOS Contact page
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

class ContactView extends React.Component {
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

module.exports = ContactView
