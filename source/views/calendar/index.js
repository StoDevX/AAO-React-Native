// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {TabNavigator} from 'react-navigation'
import {TabBarIcon} from '../components/tabbar-icon'
import * as c from '../components/colors'

import {GoogleCalendarView} from './calendar-google'

export {EventDetail} from './event-detail'

const StOlafTab = ({navigation}) =>
  <GoogleCalendarView
    navigation={navigation}
    calendarId="le6tdd9i38vgb7fcmha0hu66u9gjus2e@import.calendar.google.com"
  />
StOlafTab.navigationOptions = {
  tabBarLabel: 'St. Olaf',
  tabBarIcon: TabBarIcon('school'),
}

const OlevilleTab = ({navigation}) =>
  <GoogleCalendarView
    navigation={navigation}
    calendarId="stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com"
  />
OlevilleTab.navigationOptions = {
  tabBarLabel: 'Oleville',
  tabBarIcon: TabBarIcon('happy'),
}

const NorthfieldTab = ({navigation}) =>
  <GoogleCalendarView
    navigation={navigation}
    calendarId="thisisnorthfield@gmail.com"
  />
NorthfieldTab.navigationOptions = {
  tabBarLabel: 'Northfield',
  tabBarIcon: TabBarIcon('pin'),
}

export default TabNavigator(
  {
    StOlafCalendarView: {screen: StOlafTab},
    OlevilleCalendarView: {screen: OlevilleTab},
    NorthfieldCalendarView: {screen: NorthfieldTab},
  },
  {
    navigationOptions: {
      title: 'Calendar',
    },
    tabBarOptions: {
      activeTintColor: c.mandarin,
    },
  },
)
