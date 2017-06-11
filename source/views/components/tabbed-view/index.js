// @flow

import {
  TabNavigator as TabNav,
  NavigationScreenRouteConfig,
} from 'react-navigation'
import * as c from '../colors'

type ComponentType = (
  screens: {[key: string]: NavigationScreenRouteConfig},
  options: any, // I don't know how to type this better…
  // the package provides a bunch of types… but it doesn't even use some
  // of them??? and none seem to be the combination of args to the second
  // arg of TabNavigator.
) => TabNav

export const TabNavigator: ComponentType = (screens, options) => TabNav(
  screens,
  {
    backBehavior: 'none',
    tabBarOptions: {
      activeTintColor: c.mandarin,
      ...(options.tabBarOptions || {}),
    },
    ...options,
  },
)
