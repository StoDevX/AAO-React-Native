// @flow
import CalendarView from './calendar'

export default [
  {
    id: 'master',
    title: 'St. Olaf',
    rnVectorIcon: {iconName: 'school'},
    component: CalendarView,
    props: {calendarId: 'le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com'},
  },
  {
    id: 'oleville',
    title: 'Oleville',
    rnVectorIcon: {iconName: 'happy'},
    component: CalendarView,
    props: {calendarId: 'stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com'},
  },
  {
    id: 'pause',
    title: 'The Pause',
    rnVectorIcon: {iconName: 'paw'},
    component: CalendarView,
    props: {calendarId: 'stolaf.edu_qkrej5rm8c8582dlnc28nreboc@group.calendar.google.com'},
  },
  {
    id: 'northfield',
    title: 'Northfield',
    rnVectorIcon: {iconName: 'pin'},
    component: CalendarView,
    props: {calendarId: 'thisisnorthfield%40gmail.com'},
  },
]
