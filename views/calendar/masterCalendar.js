/**
 * All About Olaf
 * Master Calendar page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView,
} from 'react-native'

import CalendarView from './calendar'

export default class MasterCalendarView extends React.Component {
  render() {
    return (
      <CalendarView events='master' />
    )
  }
}
