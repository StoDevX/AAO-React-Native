// @flow
import {GoogleCalendarView} from './calendar-google'
import {PresenceCalendarView} from './calendar-presence'

export default [
  {
    id: 'StOlafCalendarView',
    title: 'St. Olaf',
    rnVectorIcon: {iconName: 'school'},
    component: GoogleCalendarView,
    props: {
      calendarId: 'le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com',
    },
  },
  {
    id: 'OlevilleCalendarView',
    title: 'Oleville',
    rnVectorIcon: {iconName: 'happy'},
    component: GoogleCalendarView,
    props: {
      calendarId: 'stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com',
    },
  },
  {
    id: 'PauseCalendarView',
    title: 'The Pause',
    rnVectorIcon: {iconName: 'paw'},
    component: GoogleCalendarView,
    props: {
      calendarId: 'stolaf.edu_qkrej5rm8c8582dlnc28nreboc@group.calendar.google.com',
    },
  },
  {
    id: 'StudentOrgsCalendarView',
    title: 'Student Orgs',
    rnVectorIcon: {iconName: 'people'},
    component: PresenceCalendarView,
    props: {url: 'https://api.presence.io/stolaf/v1/events'},
  },
  {
    id: 'NorthfieldCalendarView',
    title: 'Northfield',
    rnVectorIcon: {iconName: 'pin'},
    component: GoogleCalendarView,
    props: {calendarId: 'thisisnorthfield%40gmail.com'},
  },
]
