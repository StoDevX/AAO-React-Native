// @flow
/**
 * All About Olaf
 * Media page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import TabbedView from '../components/tabbed-view'
import tabs from './tabs'


export default function MediaPage() {
  return <TabbedView style={styles.container} tabs={tabs} />
}
MediaPage.propTypes = {
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
