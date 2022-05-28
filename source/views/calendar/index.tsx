import * as React from 'react'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {CccCalendarView} from '@frogpond/ccc-calendar'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

type Params = {
	StOlafCalendarView: undefined
	OlevilleCalendarView: undefined
	NorthfieldCalendarView: undefined
}

const Tabs = createBottomTabNavigator<Params>()

function StOlafCalendarView() {
	return (
		<CccCalendarView
			calendar="stolaf"
			poweredBy={{
				title: 'Powered by the St. Olaf calendar',
				href: 'https://wp.stolaf.edu/calendar/',
			}}
		/>
	)
}

function OlevilleCalendarView() {
	return (
		<CccCalendarView
			calendar="oleville"
			poweredBy={{
				title: 'Powered by the Oleville calendar',
				href: 'https://oleville.com/events/',
			}}
		/>
	)
}

function NorthfieldCalendarView() {
	return (
		<CccCalendarView
			calendar="northfield"
			poweredBy={{
				title: 'Powered by VisitingNorthfield.com',
				href: 'https://visitingnorthfield.com/events/calendar/',
			}}
		/>
	)
}

function CalendarView(): JSX.Element {
	return (
		<Tabs.Navigator>
			<Tabs.Screen
				component={StOlafCalendarView}
				name="StOlafCalendarView"
				options={{
					tabBarLabel: 'St. Olaf',
					tabBarIcon: TabBarIcon('school'),
					headerShown: false,
				}}
			/>
			<Tabs.Screen
				component={OlevilleCalendarView}
				name="OlevilleCalendarView"
				options={{
					tabBarLabel: 'Oleville',
					tabBarIcon: TabBarIcon('happy'),
					headerShown: false,
				}}
			/>
			<Tabs.Screen
				component={NorthfieldCalendarView}
				name="NorthfieldCalendarView"
				options={{
					tabBarLabel: 'Northfield',
					tabBarIcon: TabBarIcon('happy'),
					headerShown: false,
				}}
			/>
		</Tabs.Navigator>
	)
}

export {CalendarView as View}

export const NavigationKey = 'Calendar'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Calendar',
}

export type NavigationParams = undefined
