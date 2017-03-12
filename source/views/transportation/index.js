// @flow
/**
 * All About Olaf
 * Transportation page
 */

import React from 'react'

import {TabbedView} from '../components/tabbed-view'

import OtherModesView from './otherModes'
import BusView from './bus'

export default function TransportationPage() {
  return (
    <TabbedView
      tabs={[
        {
          id: 'ExpressLineBusView',
          title: 'Express Bus',
          icon: 'bus',
          render: () => <BusView line="Express Bus" />,
        },

        {
          id: 'RedLineBusView',
          title: 'Red Line',
          icon: 'bus',
          render: () => <BusView line="Red Line" />,
        },

        {
          id: 'BlueLineBusView',
          title: 'Blue Line',
          icon: 'bus',
          render: () => <BusView line="Blue Line" />,
        },

        {
          id: 'TransportationOtherModesListView',
          title: 'Other Modes',
          icon: 'boat',
          render: () => <OtherModesView line="Other Modes" />,
        },
      ]}
    />
  )
}
