// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {StyleSheet, Navigator} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default function SISView({navigator}: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    navigator={navigator}
    title='SIS'
    renderScene={() => <TabbedView style={styles.container} tabs={tabs} />}
  />
}

SISView.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
}
