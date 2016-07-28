/**
 * All About Olaf
 * Oleville Calendar page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView,
} from 'react-native'

import CalendarView from './calendar'

export default class OlevilleCalendarView extends React.Component {
  render() {
    return (
      <CalendarView events='oleville' />
    )
  }
}
