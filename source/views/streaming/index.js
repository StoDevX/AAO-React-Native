// @flow
/**
 * All About Olaf
 * Media page
 */

import React from 'react'

import {TabNavigator} from 'react-navigation'
import {TabBarIcon} from '../components/tabbar-icon'
import * as c from '../components/colors'

import KSTOView from './radio'
// import WeeklyMovieView from './movie'
import WebcamsView from './webcams'

const KstoTab = () => <KSTOView />
KstoTab.navigationOptions = {
  tabBarLabel: 'KSTO',
  tabBarIcon: TabBarIcon('radio'),
}

// const WeeklyMovieTab = () => <WeeklyMovieView />
// WeeklyMovieTab.navigationOptions = {
//   tabBarLabel: 'film',
//   tabBarIcon: TabBarIcon('bus'),
// }

const WebcamsTab = () => <WebcamsView />
WebcamsTab.navigationOptions = {
  tabBarLabel: 'Webcams',
  tabBarIcon: TabBarIcon('videocam'),
}

export default TabNavigator({
  KSTORadioView: {screen: KstoTab},
  // WeeklyMovieView: {screen: WeeklyMovieTab},
  LiveWebcamsView: {screen: WebcamsTab},
}, {
  navigationOptions: {
    title: 'Streaming Media',
  },
  tabBarOptions: {
    activeTintColor: c.mandarin,
  }
})
