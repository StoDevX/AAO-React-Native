// @flow
/**
 * All About Olaf
 * News page
 */

import React from 'react'
import {StyleSheet, Navigator} from 'react-native'

import TabbedView from '../components/tabbed-view'
import tabs from './tabs'


export default function NewsPage({navigator, route}: {navigator: typeof Navigator, route: Object}) {
  return <TabbedView style={styles.container} tabs={tabs} childProps={{navigator, route}} />
}
NewsPage.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
  route: React.PropTypes.object.isRequired,
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
