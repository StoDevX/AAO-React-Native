/**
 * All About Olaf
 * iOS BuildingHours page
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

class BuildingHoursView extends React.Component {
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
        <Text>Building Hours</Text>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})

module.exports = BuildingHoursView
