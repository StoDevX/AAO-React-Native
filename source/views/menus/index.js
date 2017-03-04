// @flow
/**
 * All About Olaf
 * Menus page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import type {TopLevelViewPropsType} from '../types'
import {TopLevelViewPropTypes} from '../types'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'

export function MenusView({navigator, route}: TopLevelViewPropsType) {
  return <TabbedView style={styles.container} tabs={tabs} navigator={navigator} route={route} />
}
MenusView.propTypes = TopLevelViewPropTypes

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
