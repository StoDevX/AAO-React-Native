// @flow
/**
 * All About Olaf
 * Transportation page
 */

import React from 'react'

import {TabbedView, Tab} from '../components/tabbed-view'

import OtherModesView from './otherModes'
import BusView from './bus'

export default function TransportationPage() {
  return (
    <TabbedView>
      <Tab
        id="ExpressLineBusView"
        title="Express Bus"
        icon="bus"
        render={() => <BusView line="Express Bus" />}
      />

      <Tab
        id="RedLineBusView"
        title="Red Line"
        icon="bus"
        render={() => <BusView line="Red Line" />}
      />

      <Tab
        id="BlueLineBusView"
        title="Blue Line"
        icon="bus"
        render={() => <BusView line="Blue Line" />}
      />

      <Tab
        id="TransportationOtherModesListView"
        title="Other Modes"
        icon="boat"
        render={() => <OtherModesView line="Other Modes" />}
      />
    </TabbedView>
  )
}
