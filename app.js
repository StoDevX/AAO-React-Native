/**
 * All About Olaf
 * Index view
 */

import React from 'react'
import {Navigator} from 'react-native'

import AboutView from './views/about'
import CalendarView from './views/calendar'
import ContactsView from './views/contacts'
import DictionaryView from './views/dictionary/dictionary'
import DirectoryView from './views/directory'
import HomeView from './views/home'
import MapView from './views/map'
import StreamingView from './views/streaming'
import MenusView from './views/menus'
import NewsView from './views/news'
import SISView from './views/sis'
import BuildingHoursView from './views/building-hours'
import TransportationView from './views/transportation'

import NoRoute from './views/components/no-route'

export default class App extends React.Component {
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
          return Navigator.SceneConfigs.PushFromRight
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
    case 'DictionaryPageView':
      return <DictionaryPageView navigator={navigator} />
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
