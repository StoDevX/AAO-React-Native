// @flow

import * as React from 'react'
import {TabNavigator} from '../../components/tabbed-view'
import {TabBarIcon} from '../../components/tabbar-icon'

import {CccCalendarView} from './calendar-ccc'

export {EventDetail} from './event-detail'

const CalendarView = TabNavigator({
	StOlafCalendarView: {
		screen: ({navigation}) => (
			<CccCalendarView
				calendar="stolaf"
				navigation={navigation}
				poweredBy={{
					title: 'Powered by the St. Olaf calendar',
					href: 'https://wp.stolaf.edu/calendar/',
				}}
			/>
		),
		navigationOptions: {
			tabBarLabel: 'St. Olaf',
			tabBarIcon: TabBarIcon('school'),
		},
	},

	OlevilleCalendarView: {
		screen: ({navigation}) => (
			<CccCalendarView
				calendar="oleville"
				navigation={navigation}
				poweredBy={{
					title: 'Powered by the Oleville calendar',
					href: 'https://oleville.com/events/',
				}}
			/>
		),
		navigationOptions: {
			tabBarLabel: 'Oleville',
			tabBarIcon: TabBarIcon('happy'),
		},
	},

	NorthfieldCalendarView: {
		screen: ({navigation}) => (
			<CccCalendarView
				calendar="northfield"
				navigation={navigation}
				poweredBy={{
					title: 'Powered by VisitingNorthfield.com',
					href: 'http://visitingnorthfield.com/events/calendar/',
				}}
			/>
		),
		navigationOptions: {
			tabBarLabel: 'Northfield',
			tabBarIcon: TabBarIcon('pin'),
		},
	},
})

CalendarView.navigationOptions = {
	title: 'Calendar',
}

export default CalendarView
