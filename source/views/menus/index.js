// @flow

import * as React from 'react'
import {TabNavigator, TabBarIcon} from '@frogpond/navigation-tabs'

import {CccBonAppMenu} from '@frogpond/ccc-bonapp-menu'
import {PauseMenu} from './pause-menu'
import {CarletonCafeIndex} from './carleton-menus'
// import {BonAppCafeViewer} from '@frogpond/bonapp-cafe-viewer'

export {
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonWeitzMenuScreen,
	CarletonSaylesMenuScreen,
} from './carleton-menus'

export const MenusView = TabNavigator({
	StavHallMenuView: {
		screen: ({navigation}) => (
			<CccBonAppMenu
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
				navigation={navigation}
			/>
		),
		navigationOptions: {
			tabBarLabel: 'Stav Hall',
			tabBarIcon: TabBarIcon('nutrition'),
		},
	},

	TheCageMenuView: {
		screen: ({navigation}) => (
			<CccBonAppMenu
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
				navigation={navigation}
			/>
		),
		navigationOptions: {
			tabBarLabel: 'The Cage',
			tabBarIcon: TabBarIcon('cafe'),
		},
	},

	ThePauseMenuView: {
		screen: ({navigation}) => (
			<PauseMenu
				loadingMessage={[
					'Mixing up a shake…',
					'Spinning up pizzas…',
					'Turning up the music…',
					'Putting ice cream on the cookies…',
					'Fixing the oven…',
				]}
				name="The Pause"
				navigation={navigation}
			/>
		),
		navigationOptions: {
			tabBarLabel: 'The Pause',
			tabBarIcon: TabBarIcon('paw'),
		},
	},

	CarletonMenuListView: {
		screen: CarletonCafeIndex,
		navigationOptions: {
			tabBarLabel: 'Carleton',
			tabBarIcon: TabBarIcon('menu'),
		},
	},

	// BonAppDevToolView: {
	// 	screen: BonAppCafeViewer,
	// 	navigationOptions: {
	// 		tabBarLabel: 'BonApp',
	// 		tabBarIcon: TabBarIcon('ionic'),
	// 	}
	// },
})
MenusView.navigationOptions = {
	title: 'Menus',
}
