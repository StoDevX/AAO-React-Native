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
          icon: 'bus',
          component: () => <BusView line="Express Bus" />,
        },
        {
          id: 'RedLineBusView',
          title: 'Red Line',
          icon: 'bus',
          component: () => <BusView line="Red Line" />,
        },
        {
          id: 'BlueLineBusView',
          title: 'Blue Line',
          icon: 'bus',
          component: () => <BusView line="Blue Line" />,
        },
        {
          id: 'TransportationOtherModesListView',
          title: 'Other Modes',
          icon: 'boat',
          component: () => <OtherModesView />,
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
