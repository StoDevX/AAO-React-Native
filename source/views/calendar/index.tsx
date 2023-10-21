import * as React from 'react'
import {Platform} from 'react-native'

import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {CccCalendarView, useNamedCalendar} from '@frogpond/ccc-calendar'
import {
	createTabNavigator,
	IosIcon,
	MaterialIcon,
	type Tab,
} from '@frogpond/navigation-tabs'

function StOlafCalendarView() {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the St. Olaf calendar',
				href: 'https://wp.stolaf.edu/calendar/',
			}}
			query={useNamedCalendar('stolaf')}
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
			query={useNamedCalendar('oleville')}
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
			query={useNamedCalendar('northfield')}
		/>
	)
}

type Params = {
	StOlafCalendarView: undefined
	OlevilleCalendarView: undefined
	NorthfieldCalendarView: undefined
}

const tabs: Tab<Params>[] = [
	{
		name: 'StOlafCalendarView',
		component: StOlafCalendarView,
		tabBarLabel: 'St. Olaf',
		tabBarIcon: Platform.select({
			ios: IosIcon('school'),
			android: MaterialIcon('school'),
		}),
	},
	{
		name: 'OlevilleCalendarView',
		component: OlevilleCalendarView,
		tabBarLabel: 'Oleville',
		tabBarIcon: Platform.select({
			ios: IosIcon('happy'),
			android: MaterialIcon('emoticon-happy'),
		}),
	},
	{
		name: 'NorthfieldCalendarView',
		component: NorthfieldCalendarView,
		tabBarLabel: 'Northfield',
		tabBarIcon: Platform.select({
			ios: IosIcon('happy'),
			android: MaterialIcon('emoticon-happy'),
		}),
	},
]

export type NavigationParams = undefined
export const View = createTabNavigator<Params>(tabs)
export const NavigationKey = 'Calendar'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Calendar',
}
