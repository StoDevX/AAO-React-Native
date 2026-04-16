import * as React from 'react'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'

import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {useQuery} from '@tanstack/react-query'

function StOlafCalendarView() {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the St. Olaf calendar',
				href: 'https://wp.stolaf.edu/calendar/',
			}}
			query={useQuery(namedCalendarOptions('stolaf'))}
		/>
	)
}

function OlevilleCalendarView() {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the Oleville calendar',
				href: 'https://oleville.com/events/',
			}}
			query={useQuery(namedCalendarOptions('oleville'))}
		/>
	)
}

function NorthfieldCalendarView() {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by VisitingNorthfield.com',
				href: 'https://visitingnorthfield.com/events/calendar/',
			}}
			query={useQuery(namedCalendarOptions('northfield'))}
		/>
	)
}

type Params = {
	StOlafCalendarView: undefined
	OlevilleCalendarView: undefined
	NorthfieldCalendarView: undefined
}

const Tab = createNativeBottomTabNavigator<Params>()

export const View = (): JSX.Element => (
	<Tab.Navigator screenOptions={{headerShown: false}}>
		<Tab.Screen
			component={StOlafCalendarView}
			name="StOlafCalendarView"
			options={{
				tabBarLabel: 'St. Olaf',
				tabBarIcon: {type: 'sfSymbol', name: 'graduationcap.fill'},
			}}
		/>
		<Tab.Screen
			component={OlevilleCalendarView}
			name="OlevilleCalendarView"
			options={{
				tabBarLabel: 'Oleville',
				tabBarIcon: {type: 'sfSymbol', name: 'face.smiling.fill'},
			}}
		/>
		<Tab.Screen
			component={NorthfieldCalendarView}
			name="NorthfieldCalendarView"
			options={{
				tabBarLabel: 'Northfield',
				tabBarIcon: {type: 'sfSymbol', name: 'face.smiling.fill'},
			}}
		/>
	</Tab.Navigator>
)

export type NavigationParams = undefined
export const NavigationKey = 'Calendar'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Calendar',
}
