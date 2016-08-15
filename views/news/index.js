// @flow
/**
 * All About Olaf
 * News page
 */

import React from 'react'
import {StyleSheet, Navigator} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'


export default function NewsPage({navigator}: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    navigator={navigator}
    title='News'
    renderScene={() => <TabbedView style={styles.container} tabs={tabs} />}
  />
}
NewsPage.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
