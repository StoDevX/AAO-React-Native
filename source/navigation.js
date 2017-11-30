// @flow

import {Platform, StyleSheet} from 'react-native'
import {TabNavigator} from 'react-navigation'
import * as c from './views/components/colors'
import {TabBarIcon} from './views/components/tabbar-icon'

import CalendarView, {EventDetail as EventDetailView} from './views/calendar'
import {ContactsView, ContactsDetailView} from './views/contacts'
import {DictionaryView, DictionaryDetailView} from './views/dictionary'
import {HomeView, EditHomeView} from './views/home'
import StreamingView, {KSTOScheduleView} from './views/streaming'
import {
  MenusView,
  CarletonBurtonMenuScreen,
  CarletonLDCMenuScreen,
  CarletonWeitzMenuScreen,
  CarletonSaylesMenuScreen,
} from './views/menus'
import {FilterView} from './views/components/filter'
import NewsView from './views/news'
import NewsItemView from './views/news/news-item'
import SISView from './views/sis'
import {JobDetailView} from './views/sis/student-work/detail'
import {
  BuildingHoursView,
  BuildingHoursDetailView,
  BuildingHoursProblemReportView,
  BuildingHoursScheduleEditorView,
} from './views/building-hours'
import TransportationView, {
  BusMap as BusMapView,
  OtherModesDetailView,
} from './views/transportation'
import SettingsView from './views/settings'
import CreditsView from './views/settings/credits'
import PrivacyView from './views/settings/privacy'
import LegalView from './views/settings/legal'
import {StudentOrgsView, StudentOrgsDetailView} from './views/student-orgs'
import {FaqView} from './views/faqs'
import HelpView from './views/help'

import {AboutTab} from './tabs/about'
import {NowTab} from './tabs/now'
import {FoodTab} from './tabs/food'
import {MeTab} from './tabs/me'
import {WhereTab} from './tabs/where'

const styles = StyleSheet.create({
  header: {
    backgroundColor: c.white,
  },
  card: {
    ...Platform.select({
      ios: {
        backgroundColor: c.white,
      },
      android: {
        backgroundColor: c.androidLightBackground,
      },
    }),
  },
})

export const AppNavigator = TabNavigator(
  {
    AboutTab: {
      screen: AboutTab,
      path: 'tab/about',
      navigationOptions: {
        tabBarLabel: 'About',
        tabBarIcon: TabBarIcon('information-circle'),
      },
    },
    NowTab: {
      screen: NowTab,
      path: 'tab/now',
      navigationOptions: {
        tabBarLabel: 'Now',
        tabBarIcon: TabBarIcon('color-palette'),
      },
    },
    FoodTab: {
      screen: FoodTab,
      path: 'tab/food',
      navigationOptions: {
        tabBarLabel: 'Food',
        tabBarIcon: TabBarIcon('nutrition'),
      },
    },
    MeTab: {
      screen: MeTab,
      path: 'tab/me',
      navigationOptions: {
        tabBarLabel: 'Me',
        tabBarIcon: TabBarIcon('contact'),
      },
    },
    WhereTab: {
      screen: WhereTab,
      path: 'tab/where',
      navigationOptions: {
        tabBarLabel: 'Where',
        tabBarIcon: TabBarIcon('pin'),
      },
    },
  },
  {
    navigationOptions: {
      headerStyle: styles.header,
      headerTintColor: c.black,
    },
    cardStyle: styles.card,
  },
)
