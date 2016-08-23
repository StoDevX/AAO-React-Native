/**
 * All About Olaf
 * Index view
 */

import React from 'react'
import {Navigator, BackAndroid} from 'react-native'

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
  console.log('renderScene', route)
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


import Icon from 'react-native-vector-icons/Entypo'
import * as c from './views/components/colors'

const styles = StyleSheet.create({
  navigationBar: {

  },
  backButton: {
    // flex: 1,
    // justifyContent: 'center',
  },
  backButtonText: {
    color: c.tint,
    // margin: 10,
    // textAlignVertical: 'top',
  },
  backButtonIcon: {
    fontSize: 16,
  },
  titleText: {
    color: 'black',
    margin: 10,
    fontSize: 16,
    fontWeight: '600',
  },
})

import { StyleSheet, TouchableOpacity, Text } from 'react-native'
import {Dimensions} from 'react-native'
let width = Dimensions.get('window').width

function ScreenTitle({children}) {
  if (children.length > 15) {
    children = children.substring(0, (width/15)) + '…'
  }
  return (
    <Text
      style={[styles.titleText]}
      numberOfLines={1}
      ellipsizeMode='tail'
    >
      {children}
    </Text>
  )
}
ScreenTitle.propTypes = {
  children: React.PropTypes.node.isRequired,
}



const navbar = (
  <Navigator.NavigationBar
    style={styles.navigationBar}
    routeMapper={{
      LeftButton(route, navigator, index, navState) {
        switch (route.id) {
          case 'HomeView':
            return (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigator.push({
                  id: 'SettingsView',
                  title: 'Settings',
                  index: route.index + 1,
                  sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
                })}
              >
                <Icon name='cog' style={styles.navigationButtonIcon} />
              </TouchableOpacity>
            )
          case 'SettingsView':
            return (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigator.pop()}
              >
                <Icon name='chevron-thin-down' style={styles.backButtonIcon} />
              </TouchableOpacity>
            )
          default: {
            if (index <= 0) {
              return null
            }
            return (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigator.pop()}
              >
                <Text style={styles.backButtonText}>
                  <Icon name='chevron-thin-left' style={styles.backButtonIcon} />
                  {navState.routeStack[index-1].title}
                </Text>
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
                style={styles.navButton}
                onPress={() => {}}
              >
                <Text style={styles.navigationButtonText}>Edit</Text>
              </TouchableOpacity>
            )

          default:
            return null
        }
      },
      Title(route) {
        return <ScreenTitle>{route.title}</ScreenTitle>
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
        renderScene={(...props) => {
          let retval = renderScene(...props)
          console.log(retval)
          return retval
        }}
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
