import * as React from 'react'

import {TabBarIcon} from '@frogpond/navigation-tabs'

import {BalancesOrAcknowledgementView} from './balances-acknowledgement'
import {View as StudentWorkView} from './student-work'
export * as studentwork from './student-work'
export {
	CourseSearchView,
	CourseSearchResultsView,
	CourseDetailView,
	CourseSearchNavigationOptions,
	CourseSearchViewNavigationOptions,
	CourseSearchDetailNavigationOptions,
} from './course-search'

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

type Params = {
	BalancesView: undefined
	CourseSearchView: undefined
	StudentWorkView: undefined
}

const Tabs = createBottomTabNavigator<Params>()

const Balances = () => <BalancesOrAcknowledgementView />
const StudentWork = () => <StudentWorkView />

const SisView = (): JSX.Element => {
	return (
		<Tabs.Navigator screenOptions={{headerShown: false}}>
			<Tabs.Screen
				component={Balances}
				name="BalancesView"
				options={{
					tabBarLabel: 'Balances',
					tabBarIcon: TabBarIcon('card'),
				}}
			/>
			<Tabs.Screen
				component={StudentWork}
				name="StudentWorkView"
				options={{
					tabBarLabel: 'Open Jobs',
					tabBarIcon: TabBarIcon('briefcase'),
				}}
			/>
		</Tabs.Navigator>
	)
}

export {SisView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'SIS',
}

export type NavigationParams = undefined
