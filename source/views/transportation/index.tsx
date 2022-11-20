import * as React from 'react'

import {TabBarIcon} from '@frogpond/navigation-tabs'

import {OtherModesView} from './other-modes'
import {BusView} from './bus'

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

type Params = {
	ExpressLineBusView: undefined
	RedLineBusView: undefined
	BlueLineBusView: undefined
	OlesGoView: undefined
	TransportationOtherModesListView: undefined
}

const Tabs = createBottomTabNavigator<Params>()

const ExpressLineBusView = () => <BusView line="Express Bus" />
const RedLineBusView = () => <BusView line="Red Line" />
const BlueLineBusView = () => <BusView line="Blue Line" />
const OlesGoView = () => <BusView line="Oles Go" />

const TransportationView = (): JSX.Element => {
	return (
		<Tabs.Navigator screenOptions={{headerShown: false}}>
			<Tabs.Screen
				component={ExpressLineBusView}
				name="ExpressLineBusView"
				options={{
					tabBarLabel: 'Express Bus',
					tabBarIcon: TabBarIcon('bus'),
				}}
			/>
			<Tabs.Screen
				component={RedLineBusView}
				name="RedLineBusView"
				options={{
					tabBarLabel: 'Red Line',
					tabBarIcon: TabBarIcon('bus'),
				}}
			/>
			<Tabs.Screen
				component={BlueLineBusView}
				name="BlueLineBusView"
				options={{
					tabBarLabel: 'Blue Line',
					tabBarIcon: TabBarIcon('bus'),
				}}
			/>
			<Tabs.Screen
				component={OlesGoView}
				name="OlesGoView"
				options={{
					tabBarLabel: 'Oles Go',
					tabBarIcon: TabBarIcon('car'),
				}}
			/>
			<Tabs.Screen
				component={OtherModesView}
				name="TransportationOtherModesListView"
				options={{
					tabBarLabel: 'Other Modes',
					tabBarIcon: TabBarIcon('boat'),
				}}
			/>
		</Tabs.Navigator>
	)
}

export {TransportationView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Transportation',
}

export type NavigationParams = undefined
