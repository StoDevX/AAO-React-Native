// @flow
/**
 * All About Olaf
 * Transportation page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import TabbedView from '../components/tabbed-view'

import OtherModesView from './otherModes'
import BusView from './bus'

export default function TransportationPage() {
  return (
    <TabbedView
      style={styles.container}
      tabs={[
        {
          id: 'ExpressLineBusView',
          title: 'Express Bus',
          rnVectorIcon: {iconName: 'bus'},
          component: BusView,
          props: {line: 'Express Bus'},
        },
        {
          id: 'RedLineBusView',
          title: 'Red Line',
          rnVectorIcon: {iconName: 'bus'},
          component: BusView,
          props: {line: 'Red Line'},
        },
        {
          id: 'BlueLineBusView',
          title: 'Blue Line',
          rnVectorIcon: {iconName: 'bus'},
          component: BusView,
          props: {line: 'Blue Line'},
        },
        {
          id: 'TransportationOtherModesListView',
          title: 'Other Modes',
          rnVectorIcon: {iconName: 'boat'},
          component: OtherModesView,
        },
      ]}
    />
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
