/**
 * All About Olaf
 * iOS Index
 */
'use strict'

// React native
var React = require('react-native')

// Home View
var HomeView = require('./views/ios/home')
// Menus View
var MenusView = require('./views/ios/menus')

// Namespacing
var {
  AppRegistry,
  Component,
  Navigator,
} = React


class App extends Component {
  render() {
    return (
      <Navigator
          initialRoute={{id: 'HomeView',
                         name: 'Index'}}
          renderScene={this.renderScene.bind(this)}
          configureScene={(route) => {
            if (route.sceneConfig) {
              return route.sceneConfig
            }
            return Navigator.SceneConfigs.FloatFromRight
          }} />
    )
  }
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
