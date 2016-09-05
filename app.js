/**
 * All About Olaf
 * Index view
 */

import React from 'react'
import {
  Navigator,
  BackAndroid,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native'

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
import SISLoginView from './views/settings/login'
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
    case 'SISLoginView': return <SISLoginView {...props} />
    case 'CreditsView': return <CreditsView {...props} />
    case 'PrivacyView': return <PrivacyView {...props} />
    case 'LegalView': return <LegalView {...props} />
    default: return <NoRoute {...props} />
  }
}


import Icon from 'react-native-vector-icons/Ionicons'
import * as c from './views/components/colors'

const navbarShadows = Platform.OS === 'ios'
  ? {
    shadowOffset: { width: 0, height: StyleSheet.hairlineWidth },
    shadowColor: 'rgb(100, 100, 100)',
    shadowOpacity: 0.5,
    shadowRadius: StyleSheet.hairlineWidth,
  }
  : {
    elevation: 4,
  }

import {Dimensions} from 'react-native'
const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 56,
    flex: 1,
    backgroundColor: c.iosLightBackground,
  },
  navigationBar: {
    backgroundColor: c.olevilleGold,
    ...navbarShadows,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 3,
  },
  backButtonText: {
    fontSize: 16,
    color: 'white',
    // fontFamily: 'System',
    marginVertical: 10,
  },
  backButtonIcon: {
    color: 'white',
    fontSize: 34,
    marginTop: Platform.OS === 'ios' ? 2 : 6,
    paddingLeft: 8,
    paddingRight: 6,
  },
  settingsIcon: {
    color: 'white',
    fontSize: 24,
    marginTop: Platform.OS === 'ios' ? 8 : 13,
    paddingLeft: 8,
    paddingRight: 6,
  },
  titleText: {
    color: 'white',
    fontSize: Platform.OS === 'ios' ? 16 : 20,
    fontWeight: 'bold',
    marginVertical: 10,
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


function LeftButton(route, navigator, index, navState) {
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
          style={[styles.backButton, {marginLeft: 10}]}
          onPress={() => navigator.pop()}
        >
          <Text style={styles.backButtonText}>Close</Text>
        </TouchableOpacity>
      )

    default: {
      if (index <= 0) {
        return null
      }
      let backTitle = navState.routeStack[index].backButtonTitle || navState.routeStack[index-1].title
      if (index === 1) {
        backTitle = 'Home'
      }
      if (Platform.OS === 'android') {
        return (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigator.pop()}
          >
              <Icon style={styles.backButtonIcon} name='md-arrow-back' />
          </TouchableOpacity>
        )
      } else {
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
  }
}

// Leaving the boilerplate here for future expansion
function RightButton(route) {
  switch (route.id) {
    default:
      return null
  }
}

function Title(route) {
  return (
    <Text
      style={[styles.titleText, {maxWidth: Dimensions.get('window').width / 2.5}]}
      numberOfLines={1}
      ellipsizeMode='tail'
    >
      {route.title}
    </Text>
  )
}

export default class App extends React.Component {
  componentDidMount() {
    BackAndroid.addEventListener('hardwareBackPress', this.registerAndroidBackButton)
  }

  componentWillUnmount() {
    BackAndroid.removeEventListener('hardwareBackPress', this.registerAndroidBackButton)
  }

  registerAndroidBackButton = () => {
    if (this._navigator && this._navigator.getCurrentRoutes().length > 1) {
      this._navigator.pop()
      return true
    }
    return false
  }

  render() {
    return (
      <Navigator
        ref={nav => this._navigator = nav}
        navigationBar={
          <Navigator.NavigationBar
            style={styles.navigationBar}
            routeMapper={{
              LeftButton,
              RightButton,
              Title,
            }}
          />
        }
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
