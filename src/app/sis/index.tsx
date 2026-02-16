import {Platform} from 'react-native'
import {
	MaterialIcon,
	IosIcon,
	createTabNavigator,
	type Tab,
} from '@frogpond/navigation-tabs'

import {BalancesOrAcknowledgementView} from './balances-acknowledgement'
import {View as StudentWorkView} from './student-work'

type Params = {
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

const SisView = createTabNavigator<Params>(tabs)
export default SisView
