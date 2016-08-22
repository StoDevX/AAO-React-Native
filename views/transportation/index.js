// @flow
/**
 * All About Olaf
 * Transportation page
 */

import React from 'react'
import {StyleSheet, Navigator} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'

export default function MenusPage({navigator}: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    navigator={navigator}
    title='Transportation'
    renderScene={() => <TabbedView style={styles.container} tabs={tabs} />}
  />
}
MenusPage.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
