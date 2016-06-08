/**
 * All About Olaf
 * iOS Directory page
 */
'use strict'

// React native
const React = require('react')
var RN = require('react-native')

// Namespacing
var {
  Navigator,
  StyleSheet,
  Text,
  View,
} = RN

const BackButton = require('./back-button')
const queryStalkernet = require('../../lib/stalkernet')

// Device info
var Dimensions = require('Dimensions')
// Screen size information
let Viewport = Dimensions.get('window')
let margin = Viewport.width / 13
let marginTop = 64


class DirectoryPage extends React.Component {
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

  search() {
    queryStalkernet({
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      username: this.state.username,
    })
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
    return <BackButton navigator={navigator} />
  },
  // Right button customization
  RightButton() {
    return null
  },
  // Title customization
  Title() {
    return (
      <Text style={styles.navigationText}>
        Directory
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

  // Directory list
  directoryList: {
    marginTop: marginTop + 10,
    marginLeft: margin,
  },

  // Navigation bar styling
  navigationBar: {
    backgroundColor: 'orange',
  },
  navigationButton: {
    flex: 1,
    justifyContent: 'center',
  },
  navigationButtonText: {
    color: 'white',
    margin: 10,
  },
  navigationText: {
    color: 'white',
    margin: 10,
    fontSize: 16,
  },
})

module.exports = DirectoryPage
