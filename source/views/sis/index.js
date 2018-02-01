// @flow

import {TabNavigator} from '../components/tabbed-view'

import BalancesView from './balances'
import StudentWorkView from './student-work'
import CourseSearchView from './course-search'
import TESView from './tes'

export default TabNavigator(
	{
		BalancesView: {screen: BalancesView},
		TESView: {screen: TESView},
		StudentWorkView: {screen: StudentWorkView},
		CourseSearchView: {screen: CourseSearchView},
	},
	{
		navigationOptions: {
			title: 'SIS',
		},
	},
)
