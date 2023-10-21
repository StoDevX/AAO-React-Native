import * as React from 'react'
import {Platform} from 'react-native'

import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {
	createTabNavigator,
	IosIcon,
	MaterialIcon,
	type Tab,
} from '@frogpond/navigation-tabs'

import {CarletonCafeIndex} from './carleton-menus'
import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'

export {
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonSaylesMenuScreen,
	CarletonWeitzMenuScreen,
} from './carleton-menus'

const StavHallMenuView = () => (
	<BonAppHostedMenu
		cafe="stav-hall"
		loadingMessage={[
			'Hunting Ferndale Turkey…',
			'Tracking wild vegan burgers…',
			'"Cooking" some lutefisk…',
			'Finding more mugs…',
			'Waiting for omelets…',
			'Putting out more cookies…',
		]}
		name="Stav Hall"
	/>
)

const TheCageMenuView = () => (
	<BonAppHostedMenu
		cafe="the-cage"
		ignoreProvidedMenus={true}
		loadingMessage={[
			'Checking for vegan cookies…',
			'Serving up some shakes…',
			'Waiting for menu screens to change…',
			'Frying chicken…',
			'Brewing coffee…',
		]}
		name="The Cage"
	/>
)

const ThePauseMenuView = () => (
	<GitHubHostedMenu
		loadingMessage={[
			'Mixing up a shake…',
			'Spinning up pizzas…',
			'Turning up the music…',
			'Putting ice cream on the cookies…',
			'Fixing the oven…',
		]}
		name="The Pause"
	/>
)

type Params = {
	StavHallMenuView: undefined
	TheCageMenuView: undefined
	ThePauseMenuView: undefined
	CarletonMenuListView: undefined
}

const tabs: Tab<Params>[] = [
	{
		name: 'StavHallMenuView',
		component: StavHallMenuView,
		tabBarLabel: 'Stav Hall',
		tabBarIcon: Platform.select({
			ios: IosIcon('nutrition'),
			android: MaterialIcon('food-apple'),
		}),
	},
	{
		name: 'TheCageMenuView',
		component: TheCageMenuView,
		tabBarLabel: 'The Cage',
		tabBarIcon: Platform.select({
			ios: IosIcon('cafe'),
			android: MaterialIcon('coffee'),
		}),
	},
	{
		name: 'ThePauseMenuView',
		component: ThePauseMenuView,
		tabBarLabel: 'The Pause',
		tabBarIcon: Platform.select({
			ios: IosIcon('paw'),
			android: MaterialIcon('paw'),
		}),
	},
	{
		name: 'CarletonMenuListView',
		component: CarletonCafeIndex,
		tabBarLabel: 'Carleton',
		tabBarIcon: Platform.select({
			ios: IosIcon('menu'),
			android: MaterialIcon('menu'),
		}),
	},
]

export type NavigationParams = undefined
export const View = createTabNavigator<Params>(tabs)
export const NavigationKey = 'Menus'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Menus',
}
