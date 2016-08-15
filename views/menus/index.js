// @flow
/**
 * All About Olaf
 * Menus page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'

export default function MenusPage() {
  return <NavigatorScreen
    {...this.props}
    title='Menus'
    renderScene={() => <TabbedView style={styles.container} tabs={tabs} />}
  />
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
