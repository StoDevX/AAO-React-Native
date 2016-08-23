// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import TabbedView from '../components/tabbed-view'
import tabs from './tabs'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default function SISView() {
  return <TabbedView style={styles.container} tabs={tabs} />
}

SISView.propTypes = {
}
