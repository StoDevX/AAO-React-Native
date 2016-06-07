/**
 * All About Olaf
 * iOS Dictionary page
 */
'use strict'

// React native
const React = require('react')
const RN = require('react-native')

// Namespacing
const {
  Navigator,
  StyleSheet,
  Text,
  View,
} = RN

// Device info
var Dimensions = require('Dimensions')
// Screen size information
let Viewport = Dimensions.get('window')
let margin = Viewport.width / 13
let marginTop = 64

const backButton = require('./back-button')

class DictionaryPage extends React.Component {
  render() {
    return (
      <Navigator
        renderScene={this.renderScene.bind(this)}
        navigator={this.props.navigator}
        navigationBar={
          <Navigator.NavigationBar
            style={styles.navigationBar}
            routeMapper={NavigationBarRouteMapper}
          />
        }
      />
    )
  }

  // Go to request page
  pushView(view, viewTitle) {
    this.props.navigator.push({
      id: view,
      title: viewTitle,
      sceneConfig: Navigator.SceneConfigs.FloatFromRight,
    })
  }

  // Render a given scene
  renderScene() {
    return (
      <View>
        <Text>
          Results Go Here
        </Text>
      </View>
    )
  }
}


var NavigationBarRouteMapper = {
  // Left button customization
  LeftButton(route, navigator) {
    return backButton(navigator)
  },
  // Right button customization
  RightButton() {
    return null
  },
  // Title customization
  Title() {
    return (
      <Text style={styles.navigationText}>
        Dictionary
      </Text>
    )
  }
}


var styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
    paddingLeft: 17,
    marginLeft: margin - 25,
    marginTop: marginTop,
    flexDirection:'row',
    flexWrap:'wrap',
  },

  // Navigation bar styling
  navigationBar: {
    backgroundColor: 'orange',
  },
  navigationText: {
    color: 'white',
    margin: 10,
    fontSize: 16,
  },
})

module.exports = DictionaryPage
