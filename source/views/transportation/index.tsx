import React from 'react'
import {Platform} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {
	MaterialIcon,
	IosIcon,
	createTabNavigator,
	type Tab,
} from '@frogpond/navigation-tabs'

import {OtherModesView} from './other-modes'
import {BusView} from './bus'

type Params = {
	ExpressLineBusView: undefined
	RedLineBusView: undefined
	BlueLineBusView: undefined
	OlesGoView: undefined
	TransportationOtherModesListView: undefined
}

const ExpressLineBusView = () => <BusView line="Express Bus" />
const RedLineBusView = () => <BusView line="Red Line" />
const BlueLineBusView = () => <BusView line="Blue Line" />
const OlesGoView = () => <BusView line="Oles Go" />

const tabs: Tab<Params>[] = [
	{
		name: 'ExpressLineBusView',
		component: ExpressLineBusView,
		tabBarLabel: 'Express Bus',
		tabBarIcon: Platform.select({
			ios: IosIcon('bus'),
			android: MaterialIcon('bus'),
		}),
	},
	{
		name: 'RedLineBusView',
		component: RedLineBusView,
		tabBarLabel: 'Red Line',
		tabBarIcon: Platform.select({
			ios: IosIcon('bus'),
			android: MaterialIcon('bus'),
		}),
	},
	{
		name: 'BlueLineBusView',
		component: BlueLineBusView,
		tabBarLabel: 'Blue Line',
		tabBarIcon: Platform.select({
			ios: IosIcon('bus'),
			android: MaterialIcon('bus'),
		}),
	},
	{
		name: 'OlesGoView',
		component: OlesGoView,
		tabBarLabel: 'Oles Go',
		tabBarIcon: Platform.select({
			ios: IosIcon('car'),
			android: MaterialIcon('car'),
		}),
	},
	{
		name: 'TransportationOtherModesListView',
		component: OtherModesView,
		tabBarLabel: 'Other Modes',
		tabBarIcon: Platform.select({
			ios: IosIcon('boat'),
			android: MaterialIcon('sail-boat'),
		}),
	},
]

export type NavigationParams = undefined
export const View = createTabNavigator<Params>(tabs)
export const NavigationKey = 'Transportation'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Transportation',
}
