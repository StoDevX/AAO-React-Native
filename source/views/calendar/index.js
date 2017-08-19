// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import {GoogleCalendarView} from './calendar-google'

export {EventDetail} from './event-detail'

export default TabNavigator(
  {
    StOlafCalendarView: {
      screen: ({navigation}) =>
        <GoogleCalendarView
          navigation={navigation}
          calendarId="le6tdd9i38vgb7fcmha0hu66u9gjus2e@import.calendar.google.com"
        />,
      navigationOptions: {
        tabBarLabel: 'St. Olaf',
        tabBarIcon: TabBarIcon('school'),
      },
    },

    OlevilleCalendarView: {
      screen: ({navigation}) =>
        <GoogleCalendarView
          navigation={navigation}
          calendarId="stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com"
        />,
      navigationOptions: {
        tabBarLabel: 'Oleville',
        tabBarIcon: TabBarIcon('happy'),
      },
    },

    NorthfieldCalendarView: {
      screen: ({navigation}) =>
        <GoogleCalendarView
          navigation={navigation}
          calendarId="thisisnorthfield@gmail.com"
        />,
      navigationOptions: {
        tabBarLabel: 'Northfield',
        tabBarIcon: TabBarIcon('pin'),
      },
    },
  },
  {
    navigationOptions: {
      title: 'Calendar',
    },
  },
)
