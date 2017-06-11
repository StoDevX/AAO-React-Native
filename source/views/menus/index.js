// @flow
/**
 * All About Olaf
 * Menus page
 */

import React from 'react'
import {TabNavigator} from 'react-navigation'
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
StavHallTab.navigationOptions = {
  tabBarLabel: 'Stav Hall',
  tabBarIcon: TabBarIcon('nutrition'),
}

const TheCageTab = ({navigation}) =>
  <BonAppHostedMenu
    navigation={navigation}
    name="cage"
    cafeId="262"
    ignoreProvidedMenus={true}
    loadingMessage={['Checking for vegan cookies…', 'Serving up some shakes…']}
  />
TheCageTab.navigationOptions = {
  tabBarLabel: 'The Cage',
  tabBarIcon: TabBarIcon('cafe'),
}

const ThePauseTab = ({navigation}) =>
  <GitHubHostedMenu
    navigation={navigation}
    name="pause"
    loadingMessage={['Mixing up a shake…', 'Spinning up pizzas…']}
  />
ThePauseTab.navigationOptions = {
  tabBarLabel: 'The Pause',
  tabBarIcon: TabBarIcon('paw'),
}

const CarletonTab = ({navigation}) =>
  <CarletonMenuPicker navigation={navigation} />
CarletonTab.navigationOptions = {
  tabBarLabel: 'Carleton',
  tabBarIcon: TabBarIcon('menu'),
}

export default TabNavigator(
  {
    StavHallMenuView: {screen: StavHallTab},
    TheCageMenuView: {screen: TheCageTab},
    ThePauseMenuView: {screen: ThePauseTab},
    CarletonMenuListView: {screen: CarletonTab},
    // BonAppDevToolView: {screen: BonAppPickerView},
  },
  {
    navigationOptions: {
      title: 'Menus',
    },
    tabBarOptions: {
      activeTintColor: c.mandarin,
    },
  },
)
