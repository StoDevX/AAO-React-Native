/**
 * All About Olaf
 * Index view
 */

import React from 'react'
import {Navigator, BackAndroid, StyleSheet, TouchableOpacity, Text} from 'react-native'

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
import NewsItemView from './views/news/news-item'
import SISView from './views/sis'
import BuildingHoursView from './views/building-hours'
import TransportationView from './views/transportation'
import OlevilleView from './views/oleville'
import OlevilleNewsStoryView from './views/oleville/latestView'
import SettingsView from './views/settings'
import CreditsView from './views/settings/credits'
import PrivacyView from './views/settings/privacy'
import LegalView from './views/settings/legal'

import NoRoute from './views/components/no-route'

// Render a given scene
function renderScene(route, navigator) {
  let props = {route, navigator, ...(route.props || {})}
  switch (route.id) {
    case 'HomeView': return <HomeView {...props} />
    case 'MenusView': return <MenusView {...props} />
    case 'DirectoryView': return <DirectoryView {...props} />
    case 'AboutView': return <AboutView {...props} />
    case 'CalendarView': return <CalendarView {...props} />
    case 'ContactsView': return <ContactsView {...props} />
    case 'DictionaryView': return <DictionaryView {...props} />
    case 'MapView': return <MapView {...props} />
    case 'StreamingView': return <StreamingView {...props} />
    case 'NewsView': return <NewsView {...props} />
    case 'NewsItemView': return <NewsItemView {...props} />
    case 'BuildingHoursView': return <BuildingHoursView {...props} />
    case 'SISView': return <SISView {...props} />
    case 'TransportationView': return <TransportationView {...props} />
    case 'OlevilleView': return <OlevilleView {...props} />
    case 'OlevilleNewsStoryView': return <OlevilleNewsStoryView {...props} />
    case 'SettingsView': return <SettingsView {...props} />
    case 'CreditsView': return <CreditsView {...props} />
    case 'PrivacyView': return <PrivacyView {...props} />
    case 'LegalView': return <LegalView {...props} />
    default: return <NoRoute {...props} />
  }
}


import Icon from 'react-native-vector-icons/Ionicons'
import * as c from './views/components/colors'

import {Dimensions} from 'react-native'
const styles = StyleSheet.create({
  container: {
    marginTop: 64,
    flex: 1,
  },
  navigationBar: {
    backgroundColor: c.olevilleGold,
    paddingTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: c.iosNavbarBottomBorder,
    shadowOffset: {height: 1},
    shadowOpacity: 1,
    shadowRadius: 0.1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  backButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'System',
  },
  backButtonIcon: {
    color: 'white',
    fontSize: 34,
    marginTop: 2,
    paddingLeft: 8,
    paddingRight: 6,
  },
  settingsIcon: {
    color: 'white',
    fontSize: 24,
    marginTop: 8,
    paddingLeft: 8,
    paddingRight: 6,
  },
  titleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginRight: 10,
  },
  rightButtonText: {
    fontSize: 16,
    color: 'white',
  },
})

const navbar = (
  <Navigator.NavigationBar
    style={styles.navigationBar}
    routeMapper={{
      LeftButton(route, navigator, index, navState) {
        switch (route.id) {
          case 'HomeView':
            return (
              <TouchableOpacity
                style={[styles.backButton, {marginLeft: 10}]}
                onPress={() => navigator.push({
                  id: 'SettingsView',
                  title: 'Settings',
                  index: route.index + 1,
                  sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
                })}
              >
                <Icon style={styles.settingsIcon} name='ios-settings' />
              </TouchableOpacity>
            )

          case 'SettingsView':
            return (
              <TouchableOpacity
                style={[styles.backButton, {marginLeft: 10, marginTop: 14}]}
                onPress={() => navigator.pop()}
              >
                <Text style={styles.backButtonText}>Close</Text>
              </TouchableOpacity>
            )

          default: {
            if (index <= 0) {
              return null
            }
            let backTitle = navState.routeStack[index-1].title
            if (index === 1) {
              backTitle = 'Home'
            }
            return (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigator.pop()}
              >
                <Icon style={styles.backButtonIcon} name='ios-arrow-back' />
                <Text style={styles.backButtonText}>{backTitle}</Text>
              </TouchableOpacity>
            )
          }
        }
      },

      RightButton(route) {
        switch (route.id) {
          case 'HomeView':
            return (
              <TouchableOpacity
                style={styles.rightButton}
                onPress={() => {}}
              >
                <Text style={styles.rightButtonText}>Edit</Text>
              </TouchableOpacity>
            )

          default:
            return null
        }
      },

      Title(route) {
        return (
          <Text
            style={[styles.titleText, {maxWidth: Dimensions.get('window').width / 2}]}
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {route.title}
          </Text>
        )
      },
    }}
  />
)


export default class App extends React.Component {
  componentDidMount() {
    BackAndroid.addEventListener('hardwareBackPress', () => {
      if (this._navigator && this._navigator.getCurrentRoutes().length > 1) {
        this._navigator.pop()
        return true
      }
      return false
    })
  }

  render() {
    return (
      <Navigator
        ref={nav => this._navigator = nav}
        navigationBar={navbar}
        initialRoute={{
          id: 'HomeView',
          title: 'All About Olaf',
          index: 0,
        }}
        renderScene={renderScene}
        sceneStyle={styles.container}
        configureScene={route => {
          if (route.sceneConfig) {
            return route.sceneConfig
          }
          return Navigator.SceneConfigs.PushFromRight
        }}
      />
    )
  }
}
