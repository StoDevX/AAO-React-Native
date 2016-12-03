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

import CalendarView from './views/calendar'
import ContactsView from './views/contacts'
import {DictionaryView, DictionaryDetailView} from './views/dictionary'
import DirectoryView from './views/directory'
import HomeView from './views/home'
import MapView from './views/map'
import StreamingView from './views/streaming'
import MenusView from './views/menus'
import NewsView from './views/news'
import NewsItemView from './views/news/news-item'
import SISView from './views/sis'
import {BuildingHoursView, BuildingHoursDetailView} from './views/building-hours'
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
    case 'CalendarView': return <CalendarView {...props} />
    case 'ContactsView': return <ContactsView {...props} />
    case 'DictionaryView': return <DictionaryView {...props} />
    case 'DictionaryDetailView': return <DictionaryDetailView {...props} />
    case 'MapView': return <MapView {...props} />
    case 'StreamingView': return <StreamingView {...props} />
    case 'NewsView': return <NewsView {...props} />
    case 'NewsItemView': return <NewsItemView {...props} />
    case 'BuildingHoursView': return <BuildingHoursView {...props} />
    case 'BuildingHoursDetailView': return <BuildingHoursDetailView {...props} />
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
    backgroundColor: Platform.OS === 'ios' ? c.iosLightBackground : c.androidLightBackground,
  },
  navigationBar: {
    backgroundColor: c.olevilleGold,
    ...navbarShadows,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 17,
    color: 'white',
  },
  backButtonIcon: {
    color: 'white',
    fontSize: Platform.OS === 'ios' ? 36 : 24,
    paddingVertical: Platform.OS === 'ios' ? 4 : 16,
    paddingLeft: Platform.OS === 'ios' ? 8 : 16,
    paddingRight: 6,
  },
  settingsIcon: {
    color: 'white',
    fontSize: 24,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 16,
    paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
  },
  backButtonClose: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 16,
    paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
  },
  backButtonCloseText: {
    fontSize: 17,
    color: 'white',
  },
  titleText: {
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
    fontSize: Platform.OS === 'ios' ? 17 : 20,
    fontWeight: Platform.OS === 'ios' ? 'bold' : '500',
    marginVertical: Platform.OS === 'ios' ? 12 : 14,
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

function openSettings(route, navigator) {
  let settingsButtonActive = false
  return () => {
    if (settingsButtonActive) {
      return
    }

    function closeSettings(route, navigator) {
      settingsButtonActive = false
      navigator.pop()
    }

    settingsButtonActive = true
    navigator.push({
      id: 'SettingsView',
      title: 'Settings',
      index: route.index + 1,
      sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
      onDismiss: closeSettings,
    })
  }
}

function LeftButton(route, navigator, index, navState) {
  if (route.onDismiss) {
    return null
  }

  if (route.id === 'HomeView') {
    return (
      <TouchableOpacity
        style={[styles.settingsButton]}
        onPress={openSettings(route, navigator)}
      >
        <Icon style={styles.settingsIcon} name='ios-settings' />
      </TouchableOpacity>
    )
  }

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

// Leaving the boilerplate here for future expansion
function RightButton(route, navigator) {
  if (route.onDismiss) {
    return (
      <TouchableOpacity
        style={styles.backButtonClose}
        onPress={() => route.onDismiss(route, navigator)}
      >
        <Text style={styles.backButtonCloseText}>Close</Text>
      </TouchableOpacity>
    )
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
