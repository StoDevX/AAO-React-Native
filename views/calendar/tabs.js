// @flow
import React from 'react'
import CalendarView from './calendar'

export default [
  {
    id: 'master',
    title: 'Master Events',
    rnVectorIcon: {iconName: 'graduation-cap'},
    content: () => <CalendarView source='master' />,
  },
  {
    id: 'oleville',
    title: 'Oleville Events',
    rnVectorIcon: {iconName: 'mouse-pointer'},
    content: () => <CalendarView source='oleville' />,
  },
]
