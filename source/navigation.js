// @flow

import React from 'react'
import {tracker} from './analytics'
import type {Navigator, RouteType} from './views/types'

import CalendarView, {EventDetail as EventDetailView} from './views/calendar'
import {ContactsView} from './views/contacts'
import {DictionaryView, DictionaryDetailView} from './views/dictionary'
import {HomeView, EditHomeView} from './views/home'
import StreamingView from './views/streaming'
import {MenusView} from './views/menus'
import {BonAppHostedMenu} from './views/menus/menu-bonapp'
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

import NoRoute from './views/components/no-route'

// Render a given scene
export function renderScene(route: RouteType, navigator: Navigator) {
  let props = {route, navigator, ...(route.props || {})}
  tracker.trackScreenView(route.id)

  switch (route.id) {
    case 'HomeView':
      return <HomeView {...props} />
    case 'MenusView':
      return <MenusView {...props} />
    case 'BonAppHostedMenu':
      return <BonAppHostedMenu {...props} />
    case 'FilterView':
      return <FilterView {...props} />
    case 'CalendarView':
      return <CalendarView {...props} />
    case 'EventDetailView':
      return <EventDetailView {...props} />
    case 'ContactsView':
      return <ContactsView {...props} />
    case 'DictionaryView':
      return <DictionaryView {...props} />
    case 'DictionaryDetailView':
      return <DictionaryDetailView {...props} />
    case 'StreamingView':
      return <StreamingView {...props} />
    case 'NewsView':
      return <NewsView {...props} />
    case 'NewsItemView':
      return <NewsItemView {...props} />
    case 'BuildingHoursView':
      return <BuildingHoursView {...props} />
    case 'BuildingHoursDetailView':
      return <BuildingHoursDetailView {...props} />
    case 'SISView':
      return <SISView {...props} />
    case 'JobDetailView':
      return <JobDetailView {...props} />
    case 'TransportationView':
      return <TransportationView {...props} />
    case 'SettingsView':
      return <SettingsView {...props} />
    case 'SISLoginView':
      return <SISLoginView {...props} />
    case 'CreditsView':
      return <CreditsView {...props} />
    case 'PrivacyView':
      return <PrivacyView {...props} />
    case 'LegalView':
      return <LegalView {...props} />
    case 'EditHomeView':
      return <EditHomeView {...props} />
    case 'StudentOrgsView':
      return <StudentOrgsView {...props} />
    case 'StudentOrgsDetailView':
      return <StudentOrgsDetailView {...props} />
    case 'FaqView':
      return <FaqView {...props} />
    case 'SnapshotsView':
      return <SnapshotsView {...props} />
    case 'HelpView':
      return <HelpView {...props} />
    default:
      return <NoRoute {...props} />
  }
}
