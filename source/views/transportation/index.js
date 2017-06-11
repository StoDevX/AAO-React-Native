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

export default TabNavigator(
  {
    ExpressLineBusView: {
      screen: () => <BusView line="Express Bus" />,
      navigationOptions: {
        tabBarLabel: 'Express Bus',
        tabBarIcon: TabBarIcon('bus'),
      },
    },

    RedLineBusView: {
      screen: () => <BusView line="Red Line" />,
      navigationOptions: {
        tabBarLabel: 'Red Line',
        tabBarIcon: TabBarIcon('bus'),
      },
    },

    BlueLineBusView: {
      screen: () => <BusView line="Blue Line" />,
      navigationOptions: {
        tabBarLabel: 'Blue Line',
        tabBarIcon: TabBarIcon('bus'),
      },
    },

    TransportationOtherModesListView: {
      screen: OtherModesView,
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
