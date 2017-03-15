// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'

import TabbedView from '../components/tabbed-view'
import {GoogleCalendarView} from './calendar-google'
import {PresenceCalendarView} from './calendar-presence'

export default function CalendarPage() {
  return (
    <TabbedView
      tabs={[
        {
          id: 'StOlafCalendarView',
          title: 'St. Olaf',
          icon: 'school',
          component: () => (
            <GoogleCalendarView
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
              url="https://api.presence.io/stolaf/v1/events"
            />
          ),
        },
        {
          id: 'NorthfieldCalendarView',
          title: 'Northfield',
          icon: 'pin',
          component: () => (
            <GoogleCalendarView calendarId="thisisnorthfield%40gmail.com" />
          ),
        },
      ]}
    />
  )
}
