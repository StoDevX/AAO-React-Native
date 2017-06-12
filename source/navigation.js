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
import TransportationView, {BusMapView} from './views/transportation'
import SettingsView from './views/settings'
import SISLoginView from './views/settings/login'
import CreditsView from './views/settings/credits'
import PrivacyView from './views/settings/privacy'
import LegalView from './views/settings/legal'
import {StudentOrgsView, StudentOrgsDetailView} from './views/student-orgs'
import {FaqView} from './views/faqs'
// import {SnapshotsView} from './storybook'
import HelpView from './views/help'

export const AppNavigator = StackNavigator(
  {
    HomeView: {screen: HomeView},
    BuildingHoursDetailView: {screen: BuildingHoursDetailView},
    BuildingHoursView: {screen: BuildingHoursView},
    CalendarView: {screen: CalendarView},
    ContactsView: {screen: ContactsView},
    CreditsView: {screen: CreditsView},
    DictionaryDetailView: {screen: DictionaryDetailView},
    DictionaryView: {screen: DictionaryView},
    EditHomeView: {screen: EditHomeView},
    EventDetailView: {screen: EventDetailView},
    FaqView: {screen: FaqView},
    FilterView: {screen: FilterView},
    HelpView: {screen: HelpView},
    JobDetailView: {screen: JobDetailView},
    LegalView: {screen: LegalView},
    MenusView: {screen: MenusView},
    NewsItemView: {screen: NewsItemView},
    NewsView: {screen: NewsView},
    PrivacyView: {screen: PrivacyView},
    SettingsView: {screen: SettingsView},
    SISLoginView: {screen: SISLoginView},
    SISView: {screen: SISView},
    // SnapshotsView: {screen: SnapshotsView},
    StreamingView: {screen: StreamingView},
    StudentOrgsDetailView: {screen: StudentOrgsDetailView},
    StudentOrgsView: {screen: StudentOrgsView},
    TransportationView: {screen: TransportationView},
    BusMapView: {screen: BusMapView},
  },
  {
    navigationOptions: {
      headerStyle: {
        backgroundColor: c.olevilleGold,
      },
      headerTintColor: c.white,
    },
  },
)
