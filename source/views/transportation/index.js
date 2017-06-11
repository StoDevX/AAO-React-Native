// @flow
/**
 * All About Olaf
 * Transportation page
 */

import React from 'react'

import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'
import * as c from '../components/colors'

import OtherModesView from './otherModes'
import BusView from './bus'

const ExpressLineTab = () => <BusView line="Express Bus" />
ExpressLineTab.navigationOptions = {
  tabBarLabel: 'Express Bus',
  tabBarIcon: TabBarIcon('bus'),
}

const RedLineTab = () => <BusView line="Red Line" />
RedLineTab.navigationOptions = {
  tabBarLabel: 'Red Line',
  tabBarIcon: TabBarIcon('bus'),
}

const BlueLineTab = () => <BusView line="Blue Line" />
BlueLineTab.navigationOptions = {
  tabBarLabel: 'Blue Line',
  tabBarIcon: TabBarIcon('bus'),
}

const OtherModesTab = () => <OtherModesView />
OtherModesTab.navigationOptions = {
  tabBarLabel: 'Other Modes',
  tabBarIcon: TabBarIcon('boat'),
}

export default TabNavigator(
  {
    ExpressLineBusView: {screen: ExpressLineTab},
    RedLineBusView: {screen: RedLineTab},
    BlueLineBusView: {screen: BlueLineTab},
    TransportationOtherModesListView: {screen: OtherModesTab},
  },
  {
    navigationOptions: {
      title: 'Transportation',
    },
  },
)
