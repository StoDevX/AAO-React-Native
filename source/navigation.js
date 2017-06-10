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
// import {SnapshotsView} from './storybook'
import HelpView from './views/help'

export const AppNavigator = StackNavigator(
  {
    HomeView: {screen: HomeView},
    BuildingHoursView: {screen: BuildingHoursView},
    BuildingHoursDetailView: {screen: BuildingHoursDetailView},
    CalendarView: {screen: CalendarView},
    CreditsView: {screen: CreditsView},
    DictionaryView: {screen: DictionaryView},
    DictionaryDetailView: {screen: DictionaryDetailView},
    EditHomeView: {screen: EditHomeView},
    EventDetailView: {screen: EventDetailView},
    FaqView: {screen: FaqView},
    FilterView: {screen: FilterView},
    HelpView: {screen: HelpView},
    ImportantContactsView: {screen: ContactsView},
    JobDetailView: {screen: JobDetailView},
    LegalView: {screen: LegalView},
    MenusView: {screen: MenusView},
    NewsView: {screen: NewsView},
    NewsItemView: {screen: NewsItemView},
    PrivacyView: {screen: PrivacyView},
    SettingsView: {screen: SettingsView},
    SISView: {screen: SISView},
    SISLoginView: {screen: SISLoginView},
    // Snapshots: {screen: SnapshotsView},
    StreamingView: {screen: StreamingView},
    StudentOrgsView: {screen: StudentOrgsView},
    StudentOrgsDetailView: {screen: StudentOrgsDetailView},
    TransportationView: {screen: TransportationView},
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
