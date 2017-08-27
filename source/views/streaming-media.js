// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {TabNavigator, TabBarIcon} from '../components/tabbed-view'

import {KSTOView} from '../modules/ksto-radio'
import {WebcamsView} from '../modules/webcams'
// import WeeklyMovieView from '../modules/weekly-movie'

const StreamingView = TabNavigator(
  {
    KSTORadioView: {
      screen: KSTOView,
      navigationOptions: {
        tabBarLabel: 'KSTO',
        tabBarIcon: TabBarIcon('radio'),
      },
    },
    LiveWebcamsView: {
      screen: WebcamsView,
      navigationOptions: {
        tabBarLabel: 'Webcams',
        tabBarIcon: TabBarIcon('videocam'),
      },
    },
    // WeeklyMovieView: {
    //   screen: WeeklyMovieView,
    //   navigationOptions: {
    //     tabBarLabel: 'Weekly Movie',
    //     tabBarIcon: TabBarIcon('film'),
    //   },
    // },
  },
  {
    navigationOptions: {
      title: 'Streaming Media',
    },
  },
)

export const navigation: AppNavigationType = {
  StreamingView: {screen: StreamingView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'StreamingView',
  title: 'Streaming Media',
  icon: 'video',
  tint: c.denim,
  gradient: c.lightBlueToBlueLight,
}
