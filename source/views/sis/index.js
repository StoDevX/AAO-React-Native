// @flow

import {TabNavigator} from '../components/tabbed-view'

import BalancesView from './balances'
import StudentWorkView from './student-work'
import CourseSearchView from './course-search/search'
import TESView from './tes'

export default TabNavigator(
	{
		BalancesView: {screen: BalancesView},
		CourseSearchView: {screen: CourseSearchView},
		TESView: {screen: TESView},
		StudentWorkView: {screen: StudentWorkView},
	},
	{
		navigationOptions: {
			title: 'SIS',
		},
	},
)
