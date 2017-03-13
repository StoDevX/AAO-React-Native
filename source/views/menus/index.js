// @flow
/**
 * All About Olaf
 * Menus page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import type {TopLevelViewPropsType} from '../types'
import {TopLevelViewPropTypes} from '../types'
import TabbedView from '../components/tabbed-view'
import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {CarletonMenuPicker} from './carleton-list'
//import {BonAppPickerView} from './dev-bonapp-picker'

export function MenusView({navigator, route}: TopLevelViewPropsType) {
  return (
    <TabbedView
      style={styles.container}
      tabs={[
        {
          id: 'StavHallMenuView',
          title: 'Stav Hall',
          icon: 'nutrition',
          component: BonAppHostedMenu,
          props: {
            name: 'stav',
            cafeId: '261',
            loadingMessage: [
              'Hunting Ferndale Turkey…',
              'Tracking wild vegan burgers…',
              '"Cooking" some lutefisk…',
            ],
          },
        },
        {
          id: 'TheCageMenuView',
          title: 'The Cage',
          icon: 'cafe',
          component: BonAppHostedMenu,
          props: {
            name: 'cage',
            cafeId: '262',
            ignoreProvidedMenus: true,
            loadingMessage: [
              'Checking for vegan cookies…',
              'Serving up some shakes…',
            ],
          },
        },
        {
          id: 'ThePauseMenuView',
          title: 'The Pause',
          icon: 'paw',
          component: GitHubHostedMenu,
          props: {
            name: 'pause',
            loadingMessage: ['Mixing up a shake…', 'Spinning up pizzas…'],
          },
        },
        {
          id: 'CarletonMenuListView',
          title: 'Carleton',
          icon: 'menu',
          component: CarletonMenuPicker,
          props: {
            name: 'carleton',
          },
        },
        // {
        //   id: 'BonAppDevToolView',
        //   title: 'BonApp',
        //   icon: 'ionic',
        //   component: BonAppPickerView,
        // },
      ]}
      navigator={navigator}
      route={route}
    />
  )
}
MenusView.propTypes = TopLevelViewPropTypes

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
