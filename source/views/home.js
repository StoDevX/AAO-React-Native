// @flow

import type {HomescreenViewType, AppNavigationType} from '../app/types'

import React from 'react'
import {EditHomeButton, OpenSettingsButton} from '../components/nav-buttons'
import {HomeView} from '../modules/homescreen'

export const navigation: AppNavigationType = {
  HomeView: {
    screen: HomeView,
    navigationOptions: ({navigation}) => {
      return {
        title: 'All About Olaf',
        headerBackTitle: 'Home',
        headerLeft: <OpenSettingsButton navigation={navigation} />,
        headerRight: <EditHomeButton navigation={navigation} />,
      }
    },
  },
}

export const view: HomescreenViewType = {
  type: 'hidden',
}
