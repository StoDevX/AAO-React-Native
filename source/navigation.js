// @flow

import {StackNavigator} from 'react-navigation'
import * as c from './views/components/colors'

import CalendarView, {EventDetail as EventDetailView} from './views/calendar'
import {ContactsView} from './views/contacts'
import {DictionaryView, DictionaryDetailView} from './views/dictionary'
import {HomeView, EditHomeView} from './views/home'
import StreamingView from './views/streaming'
import {MenusView} from './views/menus'
import {FilterView} from './views/components/filter'
import NewsView from './views/news'
import NewsItemView from './views/news/news-item'
import SISView from './views/sis'
import JobDetailView from './views/sis/student-work/detail'
import {
  BuildingHoursView,
  BuildingHoursDetailView,
} from './views/building-hours'
import TransportationView from './views/transportation'
import SettingsView from './views/settings'
import SISLoginView from './views/settings/login'
import CreditsView from './views/settings/credits'
import PrivacyView from './views/settings/privacy'
import LegalView from './views/settings/legal'
import {StudentOrgsView, StudentOrgsDetailView} from './views/student-orgs'
import {FaqView} from './views/faqs'
import {SnapshotsView} from './storybook'
import HelpView from './views/help'

export const AppNavigator = StackNavigator({
  Home: {screen: HomeView},
  BuildingHours: {screen: BuildingHoursView},
  BuildingHoursDetail: {screen: BuildingHoursDetailView},
  Calendar: {screen: CalendarView},
  Credits: {screen: CreditsView},
  Dictionary: {screen: DictionaryView},
  DictionaryDetail: {screen: DictionaryDetailView},
  EditHome: {screen: EditHomeView},
  EventDetail: {screen: EventDetailView},
  Faq: {screen: FaqView},
  Filter: {screen: FilterView},
  Help: {screen: HelpView},
  ImportantContacts: {screen: ContactsView},
  JobDetail: {screen: JobDetailView},
  Legal: {screen: LegalView},
  Menus: {screen: MenusView},
  News: {screen: NewsView},
  NewsItem: {screen: NewsItemView},
  Privacy: {screen: PrivacyView},
  Settings: {screen: SettingsView},
  SIS: {screen: SISView},
  SISLogin: {screen: SISLoginView},
  Snapshots: {screen: SnapshotsView},
  Streaming: {screen: StreamingView},
  StudentOrgs: {screen: StudentOrgsView},
  StudentOrgsDetail: {screen: StudentOrgsDetailView},
  Transportation: {screen: TransportationView},
}, {
  navigationOptions: {
    headerStyle: {
      backgroundColor: c.olevilleGold,
    },
    headerTintColor: c.white,
  }
})
