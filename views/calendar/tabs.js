// @flow
import React from 'react'
import CalendarView from './calendar'

export default [
  {
    id: 'master',
    title: 'Master Events',
    rnVectorIcon: {iconName: 'school'},
    component: CalendarView,
    props: {source: 'master'},
  },
  {
    id: 'oleville',
    title: 'Oleville Events',
    rnVectorIcon: {iconName: 'happy'},
    component: CalendarView,
    props: {source: 'oleville'},
  },
]
