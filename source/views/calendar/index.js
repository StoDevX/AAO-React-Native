// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'

import type {TopLevelViewPropsType} from '../types'
import TabbedView from '../components/tabbed-view'
import {GoogleCalendarView} from './calendar-google'

export {EventDetail} from './event-detail'

export default function CalendarPage({
  navigator,
  route,
}: TopLevelViewPropsType) {
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
