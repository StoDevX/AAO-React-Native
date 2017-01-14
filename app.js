/**
 * All About Olaf
 * Index view
 */

// Tweak the global fetch
import './globalize-fetch'
import {tracker} from './analytics'

import React from 'react'
import {
  Navigator,
  BackAndroid,
  StyleSheet,
  Text,
  Platform,
} from 'react-native'
import {Provider} from 'react-redux'
import {store} from './flux'
import {Touchable} from './views/components/touchable'

import CalendarView from './views/calendar'
import ContactsView from './views/contacts'
import {DictionaryView, DictionaryDetailView} from './views/dictionary'
import DirectoryView from './views/directory'
import HomeView from './views/home'
import MapView from './views/map'
import StreamingView from './views/streaming'
import {MenusView} from './views/menus'
import {FilterView} from './views/components/filter'
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
import EditHomeView from './views/editHome'
import {StudentOrgsView, StudentOrgsDetailView}  from './views/student-orgs'
import {FaqView} from './views/faqs'

import NoRoute from './views/components/no-route'

// Render a given scene
function renderScene(route, navigator) {
  let props = {route, navigator, ...(route.props || {})}
  tracker.trackScreenView(route.id)
  switch (route.id) {
    case 'HomeView': return <HomeView {...props} />
    case 'MenusView': return <MenusView {...props} />
    case 'FilterView': return <FilterView {...props} />
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
    case 'EditHomeView': return <EditHomeView {...props} />
    case 'StudentOrgsView': return <StudentOrgsView {...props} />
    case 'StudentOrgsDetailView': return <StudentOrgsDetailView {...props} />
    case 'FaqView': return <FaqView {...props} />
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
  editHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
  },
  editHomeText: {
    fontSize: 17,
    color: 'white',
    paddingVertical: Platform.OS === 'ios' ? 10 : 16,
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
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
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

let editHomeButtonActive = false
function openEditHome(route, navigator) {
  return () => {
    if (editHomeButtonActive || settingsButtonActive) {
      return
    }

    function closeEditHome(route, navigator) {
      editHomeButtonActive = false
      navigator.pop()
    }

    editHomeButtonActive = true
    navigator.push({
      id: 'EditHomeView',
      title: 'Edit Home',
      index: route.index + 1,
      sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
      onDismiss: closeEditHome,
    })
  }
}

let settingsButtonActive = false
function openSettings(route, navigator) {
  return () => {
    if (settingsButtonActive || editHomeButtonActive) {
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
    let onPressSettings = (settingsButtonActive || editHomeButtonActive) ? () => {} : openSettings(route, navigator)
    return (
      <Touchable
        borderless
        highlight={false}
        style={[styles.settingsButton]}
        onPress={onPressSettings}
      >
        <Icon style={styles.settingsIcon} name='ios-settings' />
      </Touchable>
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
      <Touchable
        borderless
        highlight={false}
        style={styles.backButton}
        onPress={() => navigator.pop()}
      >
        <Icon style={styles.backButtonIcon} name='md-arrow-back' />
      </Touchable>
    )
  } else {
    return (
      <Touchable
        borderless
        highlight={false}
        style={styles.backButton}
        onPress={() => navigator.pop()}
      >
        <Icon style={styles.backButtonIcon} name='ios-arrow-back' />
        <Text style={styles.backButtonText}>{backTitle}</Text>
      </Touchable>
    )
  }
}

// Leaving the boilerplate here for future expansion
function RightButton(route, navigator) {
  if (route.onDismiss) {
    if (route.id === 'SettingsView' || route.id === 'EditHomeView') {
      settingsButtonActive = false
      editHomeButtonActive = false
    }
    return (
      <Touchable
        borderless
        highlight={false}
        style={styles.backButtonClose}
        onPress={() => route.onDismiss(route, navigator)}
      >
        <Text style={styles.backButtonCloseText}>Close</Text>
      </Touchable>
    )
  }
  if (route.id === 'HomeView') {
    let onPressEditHome = (settingsButtonActive || editHomeButtonActive) ? () => {} : openEditHome(route, navigator)
    return (
      <Touchable
        borderless
        highlight={false}
        style={[styles.editHomeButton]}
        onPress={onPressEditHome}
      >
        <Text style={[styles.editHomeText]}>Edit</Text>
      </Touchable>
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

class App extends React.Component {
  componentDidMount() {
    tracker.trackEvent('app', 'launch')
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

export default () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}
