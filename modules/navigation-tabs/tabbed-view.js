// @flow

import {Platform} from 'react-native'
import {
	createBottomTabNavigator,
	NavigationScreenRouteConfig,
} from 'react-navigation'
import {getTheme} from '@frogpond/app-theme'
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

export const TabNavigator: ComponentType = (screens, options = {}) => {
	let theme = getTheme()

	return createTabNavigator(screens, {
		// for react-native-material-bottom-tabs
		backBehavior: 'none',
		activeColor: theme.androidTabBarForeground,
		// for the <BottomNavigation/> that react-native-material-bottom-tabs wraps
		theme: {
			colors: {primary: theme.androidTabBarBackground},
		},
		...options,
		defaultNavigationOptions: {
			...(options.defaultNavigationOptions || {}),
		},
		tabBarOptions: {
			activeTintColor: theme.iosTabBarActiveColor,
			...(options.tabBarOptions || {}),
			labelStyle: {
				fontFamily: 'System',
			},
		},
	})
}
