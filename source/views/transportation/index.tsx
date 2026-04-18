import * as React from 'react'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'

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

const Tab = createNativeBottomTabNavigator<Params>()

export const View = (): React.ReactNode => (
	<Tab.Navigator screenOptions={{headerShown: false}}>
		<Tab.Screen
			component={ExpressLineBusView}
			name="ExpressLineBusView"
			options={{
				tabBarLabel: 'Express Bus',
				tabBarIcon: {type: 'sfSymbol', name: 'bus.fill'},
			}}
		/>
		<Tab.Screen
			component={RedLineBusView}
			name="RedLineBusView"
			options={{
				tabBarLabel: 'Red Line',
				tabBarIcon: {type: 'sfSymbol', name: 'bus.fill'},
			}}
		/>
		<Tab.Screen
			component={BlueLineBusView}
			name="BlueLineBusView"
			options={{
				tabBarLabel: 'Blue Line',
				tabBarIcon: {type: 'sfSymbol', name: 'bus.fill'},
			}}
		/>
		<Tab.Screen
			component={OlesGoView}
			name="OlesGoView"
			options={{
				tabBarLabel: 'Oles Go',
				tabBarIcon: {type: 'sfSymbol', name: 'car.fill'},
			}}
		/>
		<Tab.Screen
			component={OtherModesView}
			name="TransportationOtherModesListView"
			options={{
				tabBarLabel: 'Other Modes',
				tabBarIcon: {type: 'sfSymbol', name: 'sailboat.fill'},
			}}
		/>
	</Tab.Navigator>
)

export type NavigationParams = undefined
export const NavigationKey = 'Transportation'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Transportation',
}
