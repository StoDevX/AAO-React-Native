import {Platform} from 'react-native'
import {NativeStackNavigationOptions} from 'expo-router-stack'
import {
	MaterialIcon,
	IosIcon,
	createTabNavigator,
	type Tab,
} from '@frogpond/navigation-tabs'

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

interface Params {
	BalancesView: undefined
	StudentWorkView: undefined
}

const tabs: Tab<Params>[] = [
	{
		name: 'BalancesView',
		component: BalancesOrAcknowledgementView,
		tabBarLabel: 'Balances',
		tabBarIcon: Platform.select({
			ios: IosIcon('card'),
			android: MaterialIcon('credit-card'),
		}),
	},
	{
		name: 'StudentWorkView',
		component: StudentWorkView,
		tabBarLabel: 'Open Jobs',
		tabBarIcon: Platform.select({
			ios: IosIcon('briefcase'),
			android: MaterialIcon('briefcase-search'),
		}),
	},
]

export type NavigationParams = undefined
export const View = createTabNavigator<Params>(tabs)
export const NavigationKey = 'SIS'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'SIS',
}
