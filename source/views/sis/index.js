// @flow

import {TabNavigator} from '../../../modules/navigation-tabs/tabbed-view'

import BalancesOrAcknowledgementView from './balances-acknowledgement'
import StudentWorkView from './student-work'
import {CourseSearchView} from './course-search'
import TESView from './tes'

export {JobDetailView} from './student-work/detail'
export {CourseSearchResultsView, CourseDetailView} from './course-search'

const SisView = TabNavigator({
	BalancesView: {screen: BalancesOrAcknowledgementView},
	CourseSearchView: {screen: CourseSearchView},
	TESView: {screen: TESView},
	StudentWorkView: {screen: StudentWorkView},
})

SisView.navigationOptions = {
	title: 'SIS',
}

export default SisView
