// @flow

import {TabNavigator} from '../components/tabbed-view'

import BalancesView from './balances'
import StudentWorkView from './student-work'
import TESView from './tes'

export default TabNavigator(
	{
		BalancesView: {screen: BalancesView},
		TESView: {screen: TESView},
		StudentWorkView: {screen: StudentWorkView},
	},
	{
		navigationOptions: {
			title: 'SIS',
		},
	},
)
