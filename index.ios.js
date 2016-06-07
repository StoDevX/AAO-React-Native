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

const AboutView = require('./views/ios/about')
const CalendarView = require('./views/ios/calendar')
const DictionaryView = require('./views/ios/dictionary')
const DirectoryView = require('./views/ios/directory')
const HomeView = require('./views/ios/home')
const MapView = require('./views/ios/map')
const MediaView = require('./views/ios/media')
const MenusView = require('./views/ios/menus')
const NewsView = require('./views/ios/news')
const SchedulesView = require('./views/ios/schedules')
const TransportationView = require('./views/ios/transportation')

// Namespacing
const {
  AppRegistry,
  Navigator,
} = RN


function noRoute(navigator) {
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

class App extends Component {
  render() {
    return (
      <Navigator
        initialRoute={{
          id: 'HomeView',
          name: 'Home',
        }}
        renderScene={this.renderScene}
        configureScene={(route) => {
          if (route.sceneConfig) {
            return route.sceneConfig
          }
          return Navigator.SceneConfigs.FloatFromRight
        }}
      />
    )
  }

  // Render a given scene
  renderScene(route, navigator) {
    switch (route.id) {
    case 'HomeView':
      return <HomeView navigator={navigator} />
    case 'MenusView':
      return <MenusView navigator={navigator} />
    case 'DirectoryView':
      return <DirectoryView navigator={navigator} />
    case 'AboutView':
      return <AboutView navigator={navigator} />
    case 'CalendarView':
      return <CalendarView navigator={navigator} />
    case 'DictionaryView':
      return <DictionaryView navigator={navigator} />
    case 'MapView':
      return <MapView navigator={navigator} />
    case 'MediaView':
      return <MediaView navigator={navigator} />
    case 'NewsView':
      return <NewsView navigator={navigator} />
    case 'SchedulesView':
      return <SchedulesView navigator={navigator} />
    case 'TransportationView':
      return <TransportationView navigator={navigator} />
    default:
      return noRoute(navigator)
    }
  }
}

AppRegistry.registerComponent('AllAboutOlaf', () => App)
