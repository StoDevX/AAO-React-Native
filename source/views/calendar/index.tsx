import * as React from 'react'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {CccCalendarView} from '@frogpond/ccc-calendar'
import {
	createBottomTabNavigator,
	BottomTabScreenProps,
} from '@react-navigation/bottom-tabs'

type Params = {
	StOlafCalendarView: undefined
	OlevilleCalendarView: undefined
	NorthfieldCalendarView: undefined
}

const Tabs = createBottomTabNavigator<Params>()

function StOlafCalendarView(
	props: BottomTabScreenProps<Params, 'StOlafCalendarView'>,
) {
	return (
		<CccCalendarView
			calendar="stolaf"
			navigation={props.navigation}
			poweredBy={{
				title: 'Powered by the St. Olaf calendar',
				href: 'https://wp.stolaf.edu/calendar/',
			}}
		/>
	)
}

function OlevilleCalendarView(
	props: BottomTabScreenProps<Params, 'OlevilleCalendarView'>,
) {
	return (
		<CccCalendarView
			calendar="oleville"
			navigation={props.navigation}
			poweredBy={{
				title: 'Powered by the Oleville calendar',
				href: 'https://oleville.com/events/',
			}}
		/>
	)
}

function NorthfieldCalendarView(
	props: BottomTabScreenProps<Params, 'NorthfieldCalendarView'>,
) {
	return (
		<CccCalendarView
			calendar="northfield"
			navigation={props.navigation}
			poweredBy={{
				title: 'Powered by VisitingNorthfield.com',
				href: 'https://visitingnorthfield.com/events/calendar/',
			}}
		/>
	)
}

export default function CalendarView() {
	return (
		<Tabs.Navigator>
			<Tabs.Screen
				name="StOlafCalendarView"
				component={StOlafCalendarView}
				options={{tabBarLabel: 'St. Olaf', tabBarIcon: TabBarIcon('school')}}
			/>
			<Tabs.Screen
				name="OlevilleCalendarView"
				component={OlevilleCalendarView}
				options={{tabBarLabel: 'Oleville', tabBarIcon: TabBarIcon('happy')}}
			/>
			<Tabs.Screen
				name="NorthfieldCalendarView"
				component={NorthfieldCalendarView}
				options={{tabBarLabel: 'Northfield', tabBarIcon: TabBarIcon('happy')}}
			/>
		</Tabs.Navigator>
	)
}
