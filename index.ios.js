/**
 * All About Olaf
 * iOS Index
 */
'use strict'

// React native
var React = require('react-native')
// Parse framework
var Parse = require('parse/react-native')
// Parse react-native
var ParseReact = require('parse-react/react-native')

/******************************************
 *
 *              Parse Keys
 *
 *****************************************/

Parse.initialize(
  'APP_ID',
  'JAVASCRIPT_KEY'
)

/******************************************
 *
 *              Views
 *
 *****************************************/

// Home View
var HomeView = require('./views/ios/home')
// Menus View
var MenusView = require('./views/ios/menus')
// Menus View
var DirectoryView = require('./views/ios/directory')

// Namespacing
var {
  AppRegistry,
  Component,
  Navigator,
} = React


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
