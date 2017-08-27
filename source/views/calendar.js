// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import React from 'react'
import {TabNavigator, TabBarIcon} from '../components/tabbed-view'

import {GoogleCalendarView} from '../modules/google-calendar'
import {EventDetail} from '../modules/calendar'

const StOlafCalendarView = {
  screen: ({navigation}) =>
    <GoogleCalendarView
      navigation={navigation}
      calendarId="le6tdd9i38vgb7fcmha0hu66u9gjus2e@import.calendar.google.com"
    />,
  navigationOptions: {
    tabBarLabel: 'St. Olaf',
    tabBarIcon: TabBarIcon('school'),
  },
}

const OlevilleCalendarView = {
  screen: ({navigation}) =>
    <GoogleCalendarView
      navigation={navigation}
      calendarId="stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com"
    />,
  navigationOptions: {
    tabBarLabel: 'Oleville',
    tabBarIcon: TabBarIcon('happy'),
  },
}

const NorthfieldCalendarView = {
  screen: ({navigation}) =>
    <GoogleCalendarView
      navigation={navigation}
      calendarId="thisisnorthfield@gmail.com"
    />,
  navigationOptions: {
    tabBarLabel: 'Northfield',
    tabBarIcon: TabBarIcon('pin'),
  },
}

const CalendarView = TabNavigator(
  {
    StOlafCalendarView,
    OlevilleCalendarView,
    NorthfieldCalendarView,
  },
  {
    navigationOptions: {
      title: 'Calendar',
    },
  },
)

export const navigation: AppNavigationType = {
  CalendarView: {screen: CalendarView},
  EventDetailView: {screen: EventDetail},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'CalendarView',
  title: 'Calendar',
  icon: 'calendar',
  tint: c.coolPurple,
  gradient: c.magentaToPurple,
}
