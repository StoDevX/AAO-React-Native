/**
 * All About Olaf
 * iOS Index
 */

import React from 'react'
import {
  AppRegistry,
  Navigator,
  View,
  TouchableOpacity,
  Text,
} from 'react-native'

import AboutView from './views/ios/about'
import CalendarView from './views/ios/calendar'
import ContactsView from './views/ios/contacts'
import DictionaryView from './views/ios/dictionary'
import DirectoryView from './views/ios/directory'
import HomeView from './views/ios/home'
import MapView from './views/ios/map'
import StreamingView from './views/ios/streaming'
import MenusView from './views/ios/menus'
import NewsView from './views/ios/news'
import SISView from './views/ios/sis'
import BuildingHoursView from './views/ios/building-hours'
import TransportationView from './views/ios/transportation'


const NoRoute = ({navigator}) =>
  <View style={{flex: 1, alignItems: 'stretch', justifyContent: 'center'}}>
    <TouchableOpacity style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}
        onPress={() => navigator.pop()}>
      <Text style={{color: 'red', fontWeight: 'bold'}}>
        No Route Found
      </Text>
    </TouchableOpacity>
  </View>

class App extends React.Component {
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
    case 'ContactsView':
      return <ContactsView navigator={navigator} />
    case 'DictionaryView':
      return <DictionaryView navigator={navigator} />
    case 'MapView':
      return <MapView navigator={navigator} />
    case 'StreamingView':
      return <StreamingView navigator={navigator} />
    case 'NewsView':
      return <NewsView navigator={navigator} />
    case 'BuildingHoursView':
      return <BuildingHoursView navigator={navigator} />
    case 'SISView':
      return <SISView navigator={navigator} />
    case 'TransportationView':
      return <TransportationView navigator={navigator} />
    default:
      return <NoRoute navigator={navigator} />
    }
  }
}

AppRegistry.registerComponent('AllAboutOlaf', () => App)
