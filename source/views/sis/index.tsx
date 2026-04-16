import * as React from 'react'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'

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

type Params = {
	BalancesView: undefined
	StudentWorkView: undefined
}

const Tab = createNativeBottomTabNavigator<Params>()

export const View = (): JSX.Element => (
	<Tab.Navigator screenOptions={{headerShown: false}}>
		<Tab.Screen
			component={BalancesOrAcknowledgementView}
			name="BalancesView"
			options={{
				tabBarLabel: 'Balances',
				tabBarIcon: {type: 'sfSymbol', name: 'creditcard.rewards.fill'},
			}}
		/>
		<Tab.Screen
			component={StudentWorkView}
			name="StudentWorkView"
			options={{
				tabBarLabel: 'Open Jobs',
				tabBarIcon: {type: 'sfSymbol', name: 'briefcase.fill'},
			}}
		/>
	</Tab.Navigator>
)

export type NavigationParams = undefined
export const NavigationKey = 'SIS'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'SIS',
}
