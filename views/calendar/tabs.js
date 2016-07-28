import Icon from 'react-native-vector-icons/Entypo'

import OlevilleCalendarView from './olevilleCalendar'
import MasterCalendarView from './masterCalendar'


export default [
  {
    id: 'master',
    title: 'Master Events',
    content: MasterCalendarView,
  },
  {
    id: 'oleville',
    title: 'Oleville Events',
    content: OlevilleCalendarView,
  },
]
