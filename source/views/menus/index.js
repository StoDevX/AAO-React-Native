// @flow
/**
 * All About Olaf
 * Menus page
 */
import React from 'react'
import {StackNavigator} from 'react-navigation'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {
  CarletonCafeIndex,
  CarletonBurtonMenuScreen,
  CarletonLDCMenuScreen,
  CarletonWeitzMenuScreen,
  CarletonSaylesMenuScreen,
} from './carleton-menus'
// import {BonAppPickerView} from './dev-bonapp-picker'
import {data} from '../../../docs/menus.json'

const CarletonMenuPicker = StackNavigator(
  {
    CarletonCafeIndex: {screen: CarletonCafeIndex},
    CarletonBurtonMenuView: {screen: CarletonBurtonMenuScreen},
    CarletonLDCMenuView: {screen: CarletonLDCMenuScreen},
    CarletonWeitzMenuView: {screen: CarletonWeitzMenuScreen},
    CarletonSaylesMenuView: {screen: CarletonSaylesMenuScreen},
  },
  {
    headerMode: 'none',
  },
)

export const MenusView = TabNavigator(
  {
    StavHallMenuView: {
      screen: ({navigation}) =>
        <BonAppHostedMenu
          navigation={navigation}
          name="stav"
          cafeId="261"
          loadingMessage={data[0].bonappLoading}
        />,
      navigationOptions: {
        tabBarLabel: 'Stav Hall',
        tabBarIcon: TabBarIcon('nutrition'),
      },
    },

    TheCageMenuView: {
      screen: ({navigation}) =>
        <BonAppHostedMenu
          navigation={navigation}
          name="cage"
          cafeId="262"
          ignoreProvidedMenus={true}
          loadingMessage={data[1].cageLoading}
        />,
      navigationOptions: {
        tabBarLabel: 'The Cage',
        tabBarIcon: TabBarIcon('cafe'),
      },
    },

    ThePauseMenuView: {
      screen: ({navigation}) =>
        <GitHubHostedMenu
          navigation={navigation}
          name="pause"
          loadingMessage={data[2].pauseLoading}
        />,
      navigationOptions: {
        tabBarLabel: 'The Pause',
        tabBarIcon: TabBarIcon('paw'),
      },
    },

    CarletonMenuListView: {
      screen: CarletonMenuPicker,
      navigationOptions: {
        title: 'Carleton',
        tabBarIcon: TabBarIcon('menu'),
      },
    },

    // BonAppDevToolView: {screen: BonAppPickerView},
  },
  {
    navigationOptions: {
      title: 'Menus',
    },
  },
)
