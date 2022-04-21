import {Platform} from 'react-native'
import {NavigationScreenRouteConfig} from 'react-navigation'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

import {getTheme} from '@frogpond/app-theme'
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs'

type ComponentType = (
	screens: {[key: string]: NavigationScreenRouteConfig},
	options?: ScreenOptions, // I don't know how to type this better…
	// the package provides a bunch of types… but it doesn't even use some
	// of them??? and none seem to be the combination of args to the second
	// arg of TabNavigator.
) => unknown

type ScreenOptions = {
	defaultNavigationOptions?: Record<string, unknown>
	tabBarOptions?: Record<string, unknown>
	backBehavior?: string
	activeColor?: string
	theme?: Record<string, unknown>
}

const createTabNavigator: (
	screens: Record<string, NavigationScreenRouteConfig>,
	options?: ScreenOptions,
) => ComponentType =
	Platform.OS === 'android'
		? createMaterialBottomTabNavigator
		: createBottomTabNavigator

export const TabNavigator: ComponentType = (
	screens,
	options?: ScreenOptions,
) => {
	const theme = getTheme()
	options = options ?? {}

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
			...(options?.defaultNavigationOptions ?? {}),
		},
		tabBarOptions: {
			activeColor: theme.iosTabBarActiveColor,
			...(options?.tabBarOptions ?? {}),
			labelStyle: {
				fontFamily: 'System',
			},
		},
	})
}
