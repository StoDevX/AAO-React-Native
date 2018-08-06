// @flow

import {TabNavigator} from '../components/tabbed-view'

import BalancesView from './balances'
import StudentWorkView from './student-work'
import CourseSearchView from './course-search'
import TESView from './tes'

const SisView = TabNavigator({
	BalancesView: {screen: BalancesView},
	CourseSearchView: {screen: CourseSearchView},
	TESView: {screen: TESView},
	StudentWorkView: {screen: StudentWorkView},
})

SisView.navigationOptions = {
	title: 'SIS',
}

export default SisView
