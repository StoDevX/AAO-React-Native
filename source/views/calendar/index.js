// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'

import type {TopLevelViewPropsType} from '../types'
import TabbedView from '../components/tabbed-view'
import {GoogleCalendarView} from './calendar-google'
import {PresenceCalendarView} from './calendar-presence'

export default function CalendarPage(
  {navigator, route}: TopLevelViewPropsType,
) {
  return (
    <TabbedView
      tabs={[
        {
          id: 'StOlafCalendarView',
          title: 'St. Olaf',
          icon: 'school',
          component: () => (
            <GoogleCalendarView
              navigator={navigator}
              route={route}
              calendarId="le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com"
            />
          ),
        },
        {
          id: 'OlevilleCalendarView',
          title: 'Oleville',
          icon: 'happy',
          component: () => (
            <GoogleCalendarView
              navigator={navigator}
              route={route}
              calendarId="stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com"
            />
          ),
        },
        {
          id: 'PauseCalendarView',
          title: 'The Pause',
          icon: 'paw',
          component: () => (
            <GoogleCalendarView
              navigator={navigator}
              route={route}
              calendarId="stolaf.edu_qkrej5rm8c8582dlnc28nreboc@group.calendar.google.com"
            />
          ),
        },
        {
          id: 'StudentOrgsCalendarView',
          title: 'Student Orgs',
          icon: 'people',
          component: () => (
            <PresenceCalendarView
              navigator={navigator}
              route={route}
              url="https://api.presence.io/stolaf/v1/events"
            />
          ),
        },
        {
          id: 'NorthfieldCalendarView',
          title: 'Northfield',
          icon: 'pin',
          component: () => (
            <GoogleCalendarView
              navigator={navigator}
              route={route}
              calendarId="thisisnorthfield%40gmail.com"
            />
          ),
        },
      ]}
    />
  )
}
