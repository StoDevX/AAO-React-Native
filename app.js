/**
 * @flow
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
  Platform,
} from 'react-native'
import {Provider} from 'react-redux'
import {store} from './flux'
import * as c from './views/components/colors'
import {Title, LeftButton, RightButton, configureScene} from './views/components/navigation'

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

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 56,
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? c.iosLightBackground : c.androidLightBackground,
  },
  navigationBar: {
    backgroundColor: c.olevilleGold,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: StyleSheet.hairlineWidth },
        shadowColor: 'rgb(100, 100, 100)',
        shadowOpacity: 0.5,
        shadowRadius: StyleSheet.hairlineWidth,
      },
      android: {
        elevation: 4,
      },
    }),
  },
})

class App extends React.Component {
  componentDidMount() {
    tracker.trackEvent('app', 'launch')
    BackAndroid.addEventListener('hardwareBackPress', this.registerAndroidBackButton)
  }

  componentWillUnmount() {
    BackAndroid.removeEventListener('hardwareBackPress', this.registerAndroidBackButton)
  }

  _navigator: Navigator;

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
        configureScene={configureScene}
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
