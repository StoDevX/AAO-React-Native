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
		navigationOptions: {
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
		navigationOptions: {
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
		navigationOptions: {
			tabBarLabel: 'The Mess',
			tabBarIcon: TabBarIcon('paper'),
		},
	},
})
NewsView.navigationOptions = {
	title: 'News',
}

export default NewsView
