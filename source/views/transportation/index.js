// @flow

import * as React from 'react'

import {TabNavigator, TabBarIcon} from '@frogpond/navigation-tabs'

import {OtherModesView} from './other-modes'
import {BusView} from './bus'

export {OtherModesDetailView} from './other-modes'
export {BusMap} from './bus'

const TransportationView = TabNavigator({
	ExpressLineBusView: {
		screen: ({navigation}) => (
			<BusView line="Express Bus" navigation={navigation} />
		),
		defaultNavigationOptions: {
			tabBarLabel: 'Express Bus',
			tabBarIcon: TabBarIcon('bus'),
		},
	},

	RedLineBusView: {
		screen: ({navigation}) => (
			<BusView line="Red Line" navigation={navigation} />
		),
		defaultNavigationOptions: {
			tabBarLabel: 'Red Line',
			tabBarIcon: TabBarIcon('bus'),
		},
	},

	BlueLineBusView: {
		screen: ({navigation}) => (
			<BusView line="Blue Line" navigation={navigation} />
		),
		defaultNavigationOptions: {
			tabBarLabel: 'Blue Line',
			tabBarIcon: TabBarIcon('bus'),
		},
	},

	OlesGoView: {
		screen: ({navigation}) => (
			<BusView line="Oles Go" navigation={navigation} />
		),
		defaultNavigationOptions: {
			tabBarLabel: 'Oles Go',
			tabBarIcon: TabBarIcon('car'),
		},
	},

	TransportationOtherModesListView: {
		screen: OtherModesView,
	},
})

TransportationView.navigationOptions = {
	title: 'Transportation',
}

export default TransportationView
