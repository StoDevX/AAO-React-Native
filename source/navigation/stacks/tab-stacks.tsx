import React from 'react'

import * as home from '../../views/home'
import * as today from '../../views/today'
import * as radio from '../../views/radio'
import * as streaming from '../../views/streaming'

import {
	Stack,
	calendarScreens,
	buildingHoursScreens,
	transportationScreens,
	menuScreens,
	sisScreens,
	streamingScreens,
	contactsScreens,
	dictionaryScreens,
	orgsScreens,
	newsScreens,
	redditScreens,
	stoprintScreens,
	moreScreens,
	directoryScreens,
	faqScreens,
} from './shared'

const screenOptions = {gestureEnabled: true, headerBackTitle: ''} as const

export const TodayStackScreens = (): React.ReactNode => (
	<Stack.Navigator screenOptions={screenOptions}>
		<Stack.Screen
			component={today.View}
			name="Today"
			options={today.NavigationOptions}
		/>
		{calendarScreens()}
		{buildingHoursScreens()}
		{transportationScreens()}
	</Stack.Navigator>
)

export const MenusStackScreens = (): React.ReactNode => (
	<Stack.Navigator screenOptions={screenOptions}>
		{menuScreens()}
	</Stack.Navigator>
)

export const SISStackScreens = (): React.ReactNode => (
	<Stack.Navigator initialRouteName="SIS" screenOptions={screenOptions}>
		{sisScreens()}
	</Stack.Navigator>
)

export const RadioStackScreens = (): React.ReactNode => (
	<Stack.Navigator screenOptions={screenOptions}>
		<Stack.Screen
			component={radio.View}
			name="Radio"
			options={radio.NavigationOptions}
		/>
		<Stack.Screen
			component={streaming.KSTOScheduleView}
			name="KSTOSchedule"
			options={streaming.KSTOScheduleNavigationOptions}
		/>
		<Stack.Screen
			component={streaming.KRLXScheduleView}
			name="KRLXSchedule"
			options={streaming.KRLXScheduleNavigationOptions}
		/>
	</Stack.Navigator>
)

export const BrowseStackScreens = (): React.ReactNode => (
	<Stack.Navigator screenOptions={screenOptions}>
		<Stack.Screen
			component={home.View}
			name="Home"
			options={home.NavigationOptions}
		/>
		{calendarScreens()}
		{buildingHoursScreens()}
		{contactsScreens()}
		{dictionaryScreens()}
		{transportationScreens()}
		{menuScreens()}
		{streamingScreens()}
		{orgsScreens()}
		{newsScreens()}
		{redditScreens()}
		{sisScreens()}
		{stoprintScreens()}
		{moreScreens()}
		{directoryScreens()}
		{faqScreens()}
	</Stack.Navigator>
)
