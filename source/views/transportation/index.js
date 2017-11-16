// @flow

import * as React from 'react'

import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import {OtherModesView} from './other-modes'
import {BusView} from './bus'

export {OtherModesDetailView} from './other-modes'
export {BusMap} from './bus'

export default TabNavigator(
  {
    ExpressLineBusView: {
      screen: ({navigation}) => (
        <BusView line="Express Bus" navigation={navigation} />
      ),
      navigationOptions: {
        tabBarLabel: 'Express Bus',
        tabBarIcon: TabBarIcon('bus'),
      },
    },

    RedLineBusView: {
      screen: ({navigation}) => (
        <BusView line="Red Line" navigation={navigation} />
      ),
      navigationOptions: {
        tabBarLabel: 'Red Line',
        tabBarIcon: TabBarIcon('bus'),
      },
    },

    BlueLineBusView: {
      screen: ({navigation}) => (
        <BusView line="Blue Line" navigation={navigation} />
      ),
      navigationOptions: {
        tabBarLabel: 'Blue Line',
        tabBarIcon: TabBarIcon('bus'),
      },
    },

    TransportationOtherModesListView: {
      screen: OtherModesView,
    },
  },
  {
    navigationOptions: {
      title: 'Transportation',
    },
  },
)
