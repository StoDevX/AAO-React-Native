// @flow

import {Platform} from 'react-native'
import {
	createBottomTabNavigator,
	NavigationScreenRouteConfig,
} from 'react-navigation'
import * as c from '../colors'
import {createMaterialBottomTabNavigator} from 'react-navigation-material-bottom-tabs'

type ComponentType = (
	screens: {[key: string]: NavigationScreenRouteConfig},
	options: any, // I don't know how to type this better…
	// the package provides a bunch of types… but it doesn't even use some
	// of them??? and none seem to be the combination of args to the second
	// arg of TabNavigator.
) => typeof createTabNavigator

const createTabNavigator =
	Platform.OS === 'android'
		? createMaterialBottomTabNavigator
		: createBottomTabNavigator

export const TabNavigator: ComponentType = (screens, options = {}) =>
	createTabNavigator(screens, {
		backBehavior: 'none',
		lazy: true,
		activeTintColor: c.olevilleGold,
		tabBarOptions: {
			activeTintColor: c.black,
			...(options.tabBarOptions || {}),
			labelStyle: {
				...Platform.select({
					ios: {
						fontFamily: 'System',
					},
					android: {
						fontFamily: 'sans-serif-condensed',
						fontSize: 14,
					},
				}),
			},
		},
		...options,
	})
