// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'

import {TabbedView, Tab} from '../components/tabbed-view'
import {GoogleCalendarView} from './calendar-google'
import {PresenceCalendarView} from './calendar-presence'

export default function CalendarPage() {
  return (
    <TabbedView>
      <Tab
        id="StOlafCalendarView"
        title="St. Olaf"
        icon="school"
        render={() => (
          <GoogleCalendarView
            calendarId="le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com"
          />
        )}
      />

      <Tab
        id="OlevilleCalendarView"
        title="Oleville"
        icon="happy"
        render={() => (
          <GoogleCalendarView
            calendarId="stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com"
          />
        )}
      />

      <Tab
        id="ThePauseCalendarView"
        title="The Pause"
        icon="paw"
        render={() => (
          <GoogleCalendarView
            calendarId="stolaf.edu_qkrej5rm8c8582dlnc28nreboc@group.calendar.google.com"
          />
        )}
      />

      <Tab
        id="StudentOrgsCalendarView"
        title="Student Orgs"
        icon="people"
        render={() => (
          <PresenceCalendarView
            url="https://api.presence.io/stolaf/v1/events"
          />
        )}
      />

      <Tab
        id="NorthfieldCalendarView"
        title="Northfield"
        icon="pin"
        render={() => (
          <GoogleCalendarView calendarId="thisisnorthfield%40gmail.com" />
        )}
      />
    </TabbedView>
  )
}
