/* eslint-disable */

import React from 'react'
import {Navigator} from 'react-native'

import type {ViewCollectionType} from './types'

import {BalancesView} from '../onecard-balances'
import {BuildingHoursView} from '../building-hours'
import {CreditsView} from '../app-credits'
import {EditHomeView} from '../homescreen-edit'
import {FaqView} from '../faqs'
import {HomeView} from '../homescreen'
import {KSTOView} from '../ksto-radio'
import {LegalView} from '../legal-notice'
import {PrivacyView} from '../privacy-notice'
import {WebcamsView} from '../webcams'

import {navigation as CalendarView} from '../../views/calendar'
import {navigation as CampusDictionaryView} from '../../views/campus-dictionary'
import {navigation as ImportantContactsView} from '../../views/important-contacts'
import {navigation as MenusView} from '../../views/menus'
import {navigation as NewsView} from '../../views/news'
import {navigation as SettingsView} from '../../views/settings'
import {navigation as SisView} from '../../views/sis'
import {navigation as StreamingMediaView} from '../../views/streaming-media'
import {navigation as StudentOrgsView} from '../../views/student-orgs'
import {navigation as TransportationView} from '../../views/transportation'

import CredentialsLoginSection from '../settings/sections/login-credentials'
import OddsAndEndsSection from '../settings/sections/odds-and-ends'
import SupportSection from '../settings/sections/support'

const Nav = ({children}: {children?: Function}) =>
  <Navigator
    renderScene={(route, navigator) => children && children({route, navigator})}
  />

export const views: ViewCollectionType = {
  buildinghours: {
    list: {
      view: () => <Nav>{props => <BuildingHoursView {...props} />}</Nav>,
      delay: 1500,
    },
  },
  calendar: {
    tabs: {
      view: () => <Nav>{props => <CalendarView {...props} />}</Nav>,
      delay: 1000,
    },
  },
  contacts: {
    list: {view: () => <ImportantContactsView />, delay: 100},
  },
  dictionary: {
    list: {
      view: () => <Nav>{props => <CampusDictionaryView {...props} />}</Nav>,
      delay: 1000,
    },
  },
  home: {
    home: {view: () => <HomeView />, delay: 100},
    edit: {view: () => <EditHomeView />, delay: 500},
  },
  menus: {
    tabs: {
      view: () => <Nav>{props => <MenusView {...props} />}</Nav>,
      delay: 2000,
    },
  },
  news: {
    tabs: {
      view: () => <Nav>{props => <NewsView {...props} />}</Nav>,
      delay: 5000,
    },
  },
  settings: {
    index: {
      view: () => <Nav>{props => <SettingsView {...props} />}</Nav>,
      delay: 100,
    },
    credits: {view: () => <CreditsView />, delay: 100},
    faqs: {view: () => <FaqView />, delay: 100},
    legal: {view: () => <LegalView />, delay: 100},
    privacy: {view: () => <PrivacyView />, delay: 100},
    'section-credentials': {
      view: () => <CredentialsLoginSection />,
      delay: 100,
    },
    'section-support': {
      view: () => <Nav>{props => <SupportSection {...props} />}</Nav>,
      delay: 100,
    },
    'section-odds and ends': {
      view: () => <Nav>{props => <OddsAndEndsSection {...props} />}</Nav>,
      delay: 100,
    },
  },
  sis: {
    tabs: {
      view: () => <Nav>{props => <SisView {...props} />}</Nav>,
      delay: 100,
    },
    balances: {view: () => <BalancesView />, delay: 100},
  },
  streaming: {
    tabs: {view: () => <StreamingMediaView />, delay: 100},
    radio: {view: () => <KSTOView />, delay: 100},
    webcams: {view: () => <WebcamsView />, delay: 1000},
  },
  studentorgs: {
    list: {
      view: () => <Nav>{props => <StudentOrgsView {...props} />}</Nav>,
      delay: 2500,
    },
  },
  transit: {
    tabs: {view: () => <TransportationView />, delay: 100},
  },
}
