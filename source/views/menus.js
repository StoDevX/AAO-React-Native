// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import React from 'react'
import {TabNavigator, TabBarIcon} from '../components/tabbed-view'

import {BonAppHostedMenu} from '../modules/bonapp-menu'
import {GitHubHostedMenu} from '../modules/github-menu'
import {
  CarletonCafeIndex,
  CarletonBurtonMenuScreen,
  CarletonLDCMenuScreen,
  CarletonWeitzMenuScreen,
  CarletonSaylesMenuScreen,
} from '../modules/carleton-menus-list'
// import {BonAppPickerView} from '../modules/dev-bonapp-picker'

const StavHallMenuView = {
  screen: ({navigation}) =>
    <BonAppHostedMenu
      navigation={navigation}
      name="stav"
      cafeId="261"
      loadingMessage={[
        'Hunting Ferndale Turkey…',
        'Tracking wild vegan burgers…',
        '"Cooking" some lutefisk…',
        'Finding more mugs…',
        'Waiting for omlets…',
        'Putting out more cookies…',
      ]}
    />,
  navigationOptions: {
    tabBarLabel: 'Stav Hall',
    tabBarIcon: TabBarIcon('nutrition'),
  },
}

const TheCageMenuView = {
  screen: ({navigation}) =>
    <BonAppHostedMenu
      navigation={navigation}
      name="cage"
      cafeId="262"
      ignoreProvidedMenus={true}
      loadingMessage={[
        'Checking for vegan cookies…',
        'Serving up some shakes…',
        'Waiting for menu screens to change…',
        'Frying chicken…',
        'Brewing coffee…',
      ]}
    />,
  navigationOptions: {
    tabBarLabel: 'The Cage',
    tabBarIcon: TabBarIcon('cafe'),
  },
}

const ThePauseMenuView = {
  screen: ({navigation}) =>
    <GitHubHostedMenu
      navigation={navigation}
      name="pause"
      loadingMessage={[
        'Mixing up a shake…',
        'Spinning up pizzas…',
        'Turning up the music…',
        'Putting ice cream on the cookies…',
        'Fixing the oven…',
      ]}
    />,
  navigationOptions: {
    tabBarLabel: 'The Pause',
    tabBarIcon: TabBarIcon('paw'),
  },
}

const CarletonMenuListView = {
  screen: CarletonCafeIndex,
  navigationOptions: {
    title: 'Carleton',
    tabBarIcon: TabBarIcon('menu'),
  },
}

// const BonAppDevToolView = {
//   screen: BonAppPickerView,
//   navigationOptions: {
//     tabBarLabel: 'BonApp',
//     tabBarIcon: TabBarIcon('ionic'),
//   },
// }

const MenusView = TabNavigator(
  {
    StavHallMenuView,
    TheCageMenuView,
    ThePauseMenuView,
    CarletonMenuListView,
    // BonAppDevToolView,
  },
  {
    navigationOptions: {
      title: 'Menus',
    },
  },
)

export const navigation: AppNavigationType = {
  MenusView: {screen: MenusView},
  CarletonCafeIndex: {screen: CarletonCafeIndex},
  CarletonBurtonMenuView: {screen: CarletonBurtonMenuScreen},
  CarletonLDCMenuView: {screen: CarletonLDCMenuScreen},
  CarletonWeitzMenuView: {screen: CarletonWeitzMenuScreen},
  CarletonSaylesMenuView: {screen: CarletonSaylesMenuScreen},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'MenusView',
  title: 'Menus',
  icon: 'bowl',
  tint: c.emerald,
  gradient: c.grassToLime,
}
