// @flow

import * as React from 'react'
import {TabNavigator, TabBarIcon} from '@frogpond/navigation-tabs'

import * as newsImages from '../../../images/news-sources'
import NewsContainer from './news-container'

const NewsView = TabNavigator({
	StOlafNewsView: {
		screen: ({navigation}) => (
			<NewsContainer
				navigation={navigation}
				source="stolaf"
				thumbnail={newsImages.stolaf}
				title="St. Olaf"
			/>
		),
		defaultNavigationOptions: {
			tabBarLabel: 'St. Olaf',
			tabBarIcon: TabBarIcon('school'),
		},
	},

	OlevilleNewsView: {
		screen: ({navigation}) => (
			<NewsContainer
				navigation={navigation}
				source="oleville"
				thumbnail={newsImages.oleville}
				title="Oleville"
			/>
		),
		defaultNavigationOptions: {
			tabBarLabel: 'Oleville',
			tabBarIcon: TabBarIcon('happy'),
		},
	},

	MessNewsView: {
		screen: ({navigation}) => (
			<NewsContainer
				navigation={navigation}
				source="mess"
				thumbnail={newsImages.mess}
				title="The Mess"
			/>
		),
		defaultNavigationOptions: {
			tabBarLabel: 'The Mess',
			tabBarIcon: TabBarIcon('paper'),
		},
	},

	PoliticOleNewsView: {
		screen: ({navigation}) => (
			<NewsContainer
				navigation={navigation}
				source="politicole"
				thumbnail={newsImages.politicole}
				title="PoliticOle"
			/>
		),
		defaultNavigationOptions: {
			tabBarLabel: 'PoliticOle',
			tabBarIcon: TabBarIcon('megaphone'),
		},
	},

	KstoNewsView: {
		screen: ({navigation}) => (
			<NewsContainer
				navigation={navigation}
				source="ksto"
				thumbnail={newsImages.ksto}
				title="KSTO"
			/>
		),
		defaultNavigationOptions: {
			tabBarLabel: 'KSTO',
			tabBarIcon: TabBarIcon('radio'),
		},
	},
})
NewsView.navigationOptions = {
	title: 'News',
}

export default NewsView
