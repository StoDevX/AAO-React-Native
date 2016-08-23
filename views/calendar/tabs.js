// @flow
import React from 'react'
import CalendarView from './calendar'

export default [
  {
    id: 'master',
    title: 'Master Events',
    rnVectorIcon: {iconName: 'school'},
    content: () => <CalendarView source='master' />,
  },
  {
    id: 'oleville',
    title: 'Oleville Events',
    rnVectorIcon: {iconName: 'happy'},
    content: () => <CalendarView source='oleville' />,
  },
]
