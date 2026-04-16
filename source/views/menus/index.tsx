import * as React from 'react'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'

import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {CarletonCafeIndex} from './carleton-menus'

export {
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonWeitzMenuScreen,
	CarletonSaylesMenuScreen,
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

const Tab = createNativeBottomTabNavigator<Params>()

export const View = (): JSX.Element => (
	<Tab.Navigator screenOptions={{headerShown: false}}>
		<Tab.Screen
			component={StavHallMenuView}
			name="StavHallMenuView"
			options={{
				tabBarLabel: 'Stav Hall',
				tabBarIcon: {type: 'sfSymbol', name: 'fork.knife'},
			}}
		/>
		<Tab.Screen
			component={TheCageMenuView}
			name="TheCageMenuView"
			options={{
				tabBarLabel: 'The Cage',
				tabBarIcon: {type: 'sfSymbol', name: 'cup.and.saucer.fill'},
			}}
		/>
		<Tab.Screen
			component={ThePauseMenuView}
			name="ThePauseMenuView"
			options={{
				tabBarLabel: 'The Pause',
				tabBarIcon: {type: 'sfSymbol', name: 'pawprint.fill'},
			}}
		/>
		<Tab.Screen
			component={CarletonCafeIndex}
			name="CarletonMenuListView"
			options={{
				tabBarLabel: 'Carleton',
				tabBarIcon: {type: 'sfSymbol', name: 'list.bullet'},
			}}
		/>
	</Tab.Navigator>
)

export type NavigationParams = undefined
export const NavigationKey = 'Menus'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Menus',
}
