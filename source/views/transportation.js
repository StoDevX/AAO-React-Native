// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import React from 'react'
import {TabNavigator, TabBarIcon} from '../components/tabbed-view'

import {ModesOfTransit} from '../modules/modes-of-transit'
import {BusView, BusMapView} from '../modules/bus-line'

const ExpressLineBusView = {
  screen: ({navigation}) =>
    <BusView line="Express Bus" navigation={navigation} />,
  navigationOptions: {
    tabBarLabel: 'Express Bus',
    tabBarIcon: TabBarIcon('bus'),
  },
}

const RedLineBusView = {
  screen: ({navigation}) => <BusView line="Red Line" navigation={navigation} />,
  navigationOptions: {
    tabBarLabel: 'Red Line',
    tabBarIcon: TabBarIcon('bus'),
  },
}

const BlueLineBusView = {
  screen: ({navigation}) =>
    <BusView line="Blue Line" navigation={navigation} />,
  navigationOptions: {
    tabBarLabel: 'Blue Line',
    tabBarIcon: TabBarIcon('bus'),
  },
}

const TransportationOtherModesListView = {
  screen: ModesOfTransit,
  navigationOptions: {
    tabBarLabel: 'Other Modes',
    tabBarIcon: TabBarIcon('boat'),
  },
}

const TransportationView = TabNavigator(
  {
    ExpressLineBusView,
    RedLineBusView,
    BlueLineBusView,
    TransportationOtherModesListView,
  },
  {
    navigationOptions: {
      title: 'Transportation',
    },
  },
)

export const navigation: AppNavigationType = {
  TransportationView: {screen: TransportationView},
  BusMapView: {screen: BusMapView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'TransportationView',
  title: 'Transportation',
  icon: 'address',
  tint: c.cardTable,
  gradient: c.grayToDarkGray,
}
