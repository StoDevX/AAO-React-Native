// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'

import TabbedView from '../components/tabbed-view'
import {GoogleCalendarView} from './calendar-google'

export default function CalendarPage() {
  return (
    <TabbedView
      tabs={[
        {
          id: 'StOlafCalendarView',
          title: 'St. Olaf',
          icon: 'school',
          component: () => (
            <GoogleCalendarView calendarId="le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com" />
          ),
        },
        {
          id: 'OlevilleCalendarView',
          title: 'Oleville',
          icon: 'happy',
          component: () => (
            <GoogleCalendarView calendarId="stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com" />
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
