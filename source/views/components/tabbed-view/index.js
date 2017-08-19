// @flow

import {Platform} from 'react-native'
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

export const TabNavigator: ComponentType = (screens, options) =>
  TabNav(screens, {
    backBehavior: 'none',
    lazy: true,
    swipeEnabled: Platform.OS !== 'ios',
    tabBarOptions: {
      ...Platform.select({
        android: {
          inactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        },
        ios: {
          activeTintColor: c.mandarin,
        },
      }),
      scrollEnabled: Platform.OS == 'ios',
      ...(options.tabBarOptions || {}),
      style: {
        ...Platform.select({
          android: {
            backgroundColor: c.mandarin,
            height: 48,
          },
        }),
      },
      labelStyle: {
        ...Platform.select({
          ios: {
            fontFamily: 'System',
          },
          android: {
            fontFamily: 'sans-serif-condensed',
            fontSize: 14,
            minWidth: 100, // moved this here from `tabStyle` not cut off text...
          },
        }),
      },
    },
    ...options,
  })
