// @flow
/**
 * All About Olaf
 * Media page
 */

import React from 'react'
import {StyleSheet, Navigator} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'


export default function MediaPage({navigator}: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    navigator={navigator}
    title='Media'
    renderScene={() => <TabbedView style={styles.container} tabs={tabs} />}
  />
}
MediaPage.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
