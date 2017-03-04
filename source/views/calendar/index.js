// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import TabbedView from '../components/tabbed-view'
import tabs from './tabs'

export default function CalendarPage() {
  return <TabbedView style={styles.container} tabs={tabs} />
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
