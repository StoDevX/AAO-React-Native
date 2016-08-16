// @flow
import React from 'react'
import CalendarView from './calendar'

export default [
  {
    id: 'master',
    title: 'Master Events',
    content: () => <CalendarView source='master' />,
  },
  {
    id: 'oleville',
    title: 'Oleville Events',
    content: () => <CalendarView source='oleville' />,
  },
]
