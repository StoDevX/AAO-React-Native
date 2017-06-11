// @flow
/**
 * All About Olaf
 * Menus page
 */

import React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'
import * as c from '../components/colors'

import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {CarletonMenuPicker} from './carleton-list'
// import {BonAppPickerView} from './dev-bonapp-picker'

const StavHallTab = ({navigation}) =>
  <BonAppHostedMenu
    navigation={navigation}
    name="stav"
    cafeId="261"
    loadingMessage={[
      'Hunting Ferndale Turkey…',
      'Tracking wild vegan burgers…',
      '"Cooking" some lutefisk…',
    ]}
  />

const TheCageTab = ({navigation}) =>
  <BonAppHostedMenu
    navigation={navigation}
    name="cage"
    cafeId="262"
    ignoreProvidedMenus={true}
    loadingMessage={['Checking for vegan cookies…', 'Serving up some shakes…']}
  />

const ThePauseTab = ({navigation}) =>
  <GitHubHostedMenu
    navigation={navigation}
    name="pause"
    loadingMessage={['Mixing up a shake…', 'Spinning up pizzas…']}
  />

export const MenusView = TabNavigator(
  {
    StavHallMenuView: {
      screen: StavHallTab,
      navigationOptions: {
        tabBarLabel: 'Stav Hall',
        tabBarIcon: TabBarIcon('nutrition'),
      },
    },
    TheCageMenuView: {
      screen: TheCageTab,
      navigationOptions: {
        tabBarLabel: 'The Cage',
        tabBarIcon: TabBarIcon('cafe'),
      },
    },
    ThePauseMenuView: {
      screen: ThePauseTab,
      navigationOptions: {
        tabBarLabel: 'The Pause',
        tabBarIcon: TabBarIcon('paw'),
      },
    },
    CarletonMenuListView: {
      screen: CarletonMenuPicker,
    },
    // BonAppDevToolView: {screen: BonAppPickerView},
  },
  {
    navigationOptions: {
      title: 'Menus',
    },
  },
)
