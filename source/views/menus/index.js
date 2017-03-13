// @flow
/**
 * All About Olaf
 * Menus page
 */

import React from 'react'

import type {TopLevelViewPropsType} from '../types'
import {TabbedView} from '../components/tabbed-view'
import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {CarletonMenuPicker} from './carleton-list'
import {BonAppPickerView} from './dev-bonapp-picker'

export function MenusView({navigator, route}: TopLevelViewPropsType) {
  const BonAppMenuPicker = __DEV__
    ? {
        id: 'BonAppMenuPicker',
        title: 'BonApp',
        icon: 'ionic',
        render: () => <BonAppPickerView route={route} navigator={navigator} />,
      }
    : null

  return (
    <TabbedView
      tabs={[
        {
          id: 'StavHallMenuView',
          title: 'Stav Hall',
          icon: 'nutrition',
          render: () => (
            <BonAppHostedMenu
              route={route}
              navigator={navigator}
              name="stav"
              cafeId="261"
              loadingMessage={[
                'Hunting Ferndale Turkey…',
                'Tracking wild vegan burgers…',
                '"Cooking" some lutefisk…',
              ]}
            />
          ),
        },

        {
          id: 'TheCageMenuView',
          title: 'The Cage',
          icon: 'cafe',
          render: () => (
            <BonAppHostedMenu
              route={route}
              navigator={navigator}
              name="cage"
              cafeId="262"
              ignoreProvidedMenus={true}
              loadingMessage={[
                'Checking for vegan cookies…',
                'Serving up some shakes…',
              ]}
            />
          ),
        },

        {
          id: 'ThePauseMenuView',
          title: 'The Pause',
          icon: 'paw',
          render: () => (
            <GitHubHostedMenu
              route={route}
              navigator={navigator}
              name="pause"
              loadingMessage={['Mixing up a shake…', 'Spinning up pizzas…']}
            />
          ),
        },

        {
          id: 'CarletonMenuList',
          title: 'Carleton',
          icon: 'pin',
          render: () => (
            <CarletonMenuPicker route={route} navigator={navigator} />
          ),
        },

        BonAppMenuPicker,
      ]}
    />
  )
}
