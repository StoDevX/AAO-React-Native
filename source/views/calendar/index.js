// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import {TabbedView, Tab} from '../components/tabbed-view'
import {GoogleCalendarView} from './calendar-google'
import {PresenceCalendarView} from './calendar-presence'

export default function CalendarPage() {
  return (
    <TabbedView style={styles.container}>
      <Tab id='StOlafCalendarView' title='St. Olaf' icon='school'>
        {() => <GoogleCalendarView calendarId='le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com' />}
      </Tab>

      <Tab id='OlevilleCalendarView' title='Oleville' icon='happy'>
        {() => <GoogleCalendarView calendarId='stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com' />}
      </Tab>

      <Tab id='ThePauseCalendarView' title='The Pause' icon='paw'>
        {() => <GoogleCalendarView calendarId='stolaf.edu_qkrej5rm8c8582dlnc28nreboc@group.calendar.google.com' />}
      </Tab>

      <Tab id='StudentOrgsCalendarView' title='Student Orgs' icon='people'>
        {() => <PresenceCalendarView url='https://api.presence.io/stolaf/v1/events' />}
      </Tab>

      <Tab id='NorthfieldCalendarView' title='Northfield' icon='pin'>
        {() => <GoogleCalendarView calendarId='thisisnorthfield%40gmail.com' />}
      </Tab>
    </TabbedView>
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
