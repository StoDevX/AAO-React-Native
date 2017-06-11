// @flow
/**
 * All About Olaf
 * Transportation page
 */

import React from 'react'

import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import OtherModesView from './otherModes'
import BusView from './bus'

const ExpressLineTab = () => <BusView line="Express Bus" />

const RedLineTab = () => <BusView line="Red Line" />

const BlueLineTab = () => <BusView line="Blue Line" />

const OtherModesTab = () => <OtherModesView />

export default TabNavigator(
  {
    ExpressLineBusView: {
      screen: ExpressLineTab,
      navigationOptions: {
        tabBarLabel: 'Express Bus',
        tabBarIcon: TabBarIcon('bus'),
      },
    },
    RedLineBusView: {
      screen: RedLineTab,
      navigationOptions: {
        tabBarLabel: 'Red Line',
        tabBarIcon: TabBarIcon('bus'),
      },
    },
    BlueLineBusView: {
      screen: BlueLineTab,

      navigationOptions: {
        tabBarLabel: 'Blue Line',
        tabBarIcon: TabBarIcon('bus'),
      },
    },
    TransportationOtherModesListView: {
      screen: OtherModesTab,
      navigationOptions: {
        tabBarLabel: 'Other Modes',
        tabBarIcon: TabBarIcon('boat'),
      },
    },
  },
  {
    navigationOptions: {
      title: 'Transportation',
    },
  },
)
