// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {StyleSheet, Navigator} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'


export default function CalendarPage({navigator}: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    navigator={navigator}
    title='Calendar'
    renderScene={() => <TabbedView style={styles.container} tabs={tabs} />}
  />
}
CalendarPage.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
