// @flow
/**
 * All About Olaf
 * News page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import type {TopLevelViewPropsType} from '../types'
import {TopLevelViewPropTypes} from '../types'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'


export default function NewsPage({navigator, route}: TopLevelViewPropsType) {
  return <TabbedView style={styles.container} tabs={tabs} navigator={navigator} route={route} />
}
NewsPage.propTypes = TopLevelViewPropTypes

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
