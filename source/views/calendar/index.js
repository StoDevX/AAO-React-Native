// @flow

import * as React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import {GoogleCalendarView} from './calendar-google'

export {EventDetail} from './event-detail'

export default TabNavigator(
	{
		StOlafCalendarView: {
			screen: ({navigation}) => (
				<GoogleCalendarView
					calendarId="5g91il39n0sv4c2bjdv1jrvcpq4ulm4r@import.calendar.google.com"
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
				<GoogleCalendarView
					calendarId="stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com"
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
				<GoogleCalendarView
					calendarId="thisisnorthfield@gmail.com"
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
	},
	{
		navigationOptions: {
			title: 'Calendar',
		},
	},
)
