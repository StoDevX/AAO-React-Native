import * as React from 'react'

import {TabBarIcon} from '@frogpond/navigation-tabs'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {CarletonCafeIndex} from './carleton-menus'

export {
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonWeitzMenuScreen,
	CarletonSaylesMenuScreen,
} from './carleton-menus'

type Params = {
	StavHallMenuView: undefined
	TheCageMenuView: undefined
	ThePauseMenuView: undefined
	CarletonMenuListView: undefined
}

const Tabs = createBottomTabNavigator<Params>()

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

const CarletonMenuListView = () => CarletonCafeIndex

const MenusView = (): JSX.Element => {
	return (
		<Tabs.Navigator screenOptions={{headerShown: false}}>
			<Tabs.Screen
				component={StavHallMenuView}
				name="StavHallMenuView"
				options={{
					tabBarLabel: 'Stav Hall',
					tabBarIcon: TabBarIcon('nutrition'),
				}}
			/>
			<Tabs.Screen
				component={TheCageMenuView}
				name="TheCageMenuView"
				options={{
					tabBarLabel: 'The Cage',
					tabBarIcon: TabBarIcon('cafe'),
				}}
			/>
			<Tabs.Screen
				component={ThePauseMenuView}
				name="ThePauseMenuView"
				options={{
					tabBarLabel: 'The Pause',
					tabBarIcon: TabBarIcon('paw'),
				}}
			/>
			<Tabs.Screen
				component={CarletonMenuListView()}
				name="CarletonMenuListView"
				options={{
					tabBarLabel: 'Carleton',
					tabBarIcon: TabBarIcon('menu'),
				}}
			/>
		</Tabs.Navigator>
	)
}

export {MenusView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Menus',
}
