/**
 * All About Olaf
 * iOS Index
 */
'use strict'

// React native
const React = require('react')
const {Component} = React
var RN = require('react-native')
// Namespacing

/******************************************
 *
 *              Views
 *
 *****************************************/

const HomeView = require('./views/ios/home')
const MenusView = require('./views/ios/menus')
const DirectoryView = require('./views/ios/directory')

// Namespacing
const {
  AppRegistry,
  Navigator,
} = RN


/******************************************
 *
 *              App Class
 *
 *****************************************/

class App extends Component {
  render() {
    return (
      <Navigator
          initialRoute={{id: 'HomeView',
                         name: 'Home'}}
          renderScene={this.renderScene.bind(this)}
          configureScene={(route) => {
            if (route.sceneConfig) {
              return route.sceneConfig
            }
            return Navigator.SceneConfigs.FloatFromRight
          }} />
    )
  }

/******************************************
 *
 *              Rendering
 *
 *****************************************/

  // Render a given scene
  renderScene(route, navigator) {
    var routeId = route.id
    if (routeId === 'HomeView') {
      return (
        <HomeView
          navigator={navigator} />
      )
    }
    if (routeId === 'MenusView') {
      return (
        <MenusView
          navigator={navigator} />
      )
    }
    if (routeId === 'DirectoryView') {
      return (
        <DirectoryView
          navigator={navigator} />
      )
    }
    return this.noRoute(navigator)

  }
  noRoute(navigator) {
    return (
      <View style={{flex: 1, alignItems: 'stretch', justifyContent: 'center'}}>
        <TouchableOpacity style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}
            onPress={() => navigator.pop()}>
          <Text style={{color: 'red', fontWeight: 'bold'}}>
            No Route Found
          </Text>
        </TouchableOpacity>
      </View>
    )
  }
}

AppRegistry.registerComponent('AllAboutOlaf', () => App)
