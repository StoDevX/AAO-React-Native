// @flow
/**
 * All About Olaf
 * Menus page
 */

import React from 'react'

import type {TopLevelViewPropsType} from '../types'
import {TabbedView, Tab} from '../components/tabbed-view'
import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {CarletonMenuPicker} from './carleton-list'
import {BonAppPickerView} from './dev-bonapp-picker'

export function MenusView({navigator, route}: TopLevelViewPropsType) {
  return (
    <TabbedView>
      <Tab
        id="StavHallMenuView"
        title="Stav Hall"
        icon="nutrition"
        render={() => (
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
        )}
      />

      <Tab
        id="TheCageMenuView"
        title="The Cage"
        icon="cafe"
        render={() => (
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
        )}
      />

      <Tab
        id="ThePauseMenuView"
        title="The Pause"
        icon="paw"
        render={() => (
          <GitHubHostedMenu
            route={route}
            navigator={navigator}
            name="pause"
            loadingMessage={['Mixing up a shake…', 'Spinning up pizzas…']}
          />
        )}
      />

      <Tab
        id="CarletonMenuList"
        title="Carleton"
        icon="pin"
        render={() => (
          <CarletonMenuPicker route={route} navigator={navigator} />
        )}
      />

      {__DEV__
        ? <Tab
            id="BonAppMenuPicker"
            title="BonApp"
            icon="ionic"
            render={() => (
              <BonAppPickerView route={route} navigator={navigator} />
            )}
          />
        : null}
    </TabbedView>
  )
}
