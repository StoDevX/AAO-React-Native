// @flow

import * as React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {CarletonCafeIndex} from './carleton-menus'
// import {BonAppPickerView} from './dev-bonapp-picker'

export {
  CarletonBurtonMenuScreen,
  CarletonLDCMenuScreen,
  CarletonWeitzMenuScreen,
  CarletonSaylesMenuScreen,
} from './carleton-menus'

export const MenusView = TabNavigator(
  {
    StavHallMenuView: {
      screen: ({navigation}) => (
        <BonAppHostedMenu
          navigation={navigation}
          name="Stav Hall"
          cafeId="261"
          loadingMessage={[
            'Hunting Ferndale Turkey…',
            'Tracking wild vegan burgers…',
            '"Cooking" some lutefisk…',
            'Finding more mugs…',
            'Waiting for omlets…',
            'Putting out more cookies…',
          ]}
        />
      ),
      navigationOptions: {
        tabBarLabel: 'Stav Hall',
        tabBarIcon: TabBarIcon('nutrition'),
      },
    },

    TheCageMenuView: {
      screen: ({navigation}) => (
        <BonAppHostedMenu
          navigation={navigation}
          name="The Cage"
          cafeId="262"
          ignoreProvidedMenus={true}
          loadingMessage={[
            'Checking for vegan cookies…',
            'Serving up some shakes…',
            'Waiting for menu screens to change…',
            'Frying chicken…',
            'Brewing coffee…',
          ]}
        />
      ),
      navigationOptions: {
        tabBarLabel: 'The Cage',
        tabBarIcon: TabBarIcon('cafe'),
      },
    },

    ThePauseMenuView: {
      screen: ({navigation}) => (
        <GitHubHostedMenu
          navigation={navigation}
          name="The Pause"
          loadingMessage={[
            'Mixing up a shake…',
            'Spinning up pizzas…',
            'Turning up the music…',
            'Putting ice cream on the cookies…',
            'Fixing the oven…',
          ]}
        />
      ),
      navigationOptions: {
        tabBarLabel: 'The Pause',
        tabBarIcon: TabBarIcon('paw'),
      },
    },

    CarletonMenuListView: {
      screen: CarletonCafeIndex,
      navigationOptions: {
        tabBarLabel: 'Carleton',
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
