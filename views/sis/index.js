// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {
  StyleSheet,
} from 'react-native'

import TabbedView from '../components/tabbed-view'
import tabs from './tabs'
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default function SISView(props: {navigator: any, route: any}) {
  return <TabbedView navigator={props.navigator} route={props.route} style={styles.container} tabs={tabs} />
}
SISView.propTypes = {
  navigator: React.PropTypes.object.isRequired,
  route: React.PropTypes.object.isRequired,
}
