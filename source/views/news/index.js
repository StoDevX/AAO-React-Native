/* eslint-disable camelcase */
// @flow

import * as React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import {newsImages} from '../../../images/news-images'
import NewsContainer from './news-container'

export default TabNavigator(
	{
		StOlafNewsView: {
			screen: ({navigation}) => (
				<NewsContainer
					mode="wp-json"
					name="St. Olaf"
					navigation={navigation}
					query={{per_page: 10, _embed: true}}
					thumbnail={newsImages.stolaf}
					url="https://wp.stolaf.edu/wp-json/wp/v2/posts"
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
					embedFeaturedImage={true}
					mode="wp-json"
					name="Oleville"
					navigation={navigation}
					query={{per_page: 10, _embed: true}}
					thumbnail={newsImages.oleville}
					url="http://oleville.com/wp-json/wp/v2/posts/"
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
					mode="rss"
					name="The Mess"
					navigation={navigation}
					thumbnail={newsImages.mess}
					url="http://manitoumessenger.com/feed/"
				/>
			),
			navigationOptions: {
				tabBarLabel: 'The Mess',
				tabBarIcon: TabBarIcon('paper'),
			},
		},

		PoliticOleNewsView: {
			screen: ({navigation}) => (
				<NewsContainer
					mode="rss"
					name="PoliticOle"
					navigation={navigation}
					thumbnail={newsImages.politicole}
					url="http://oleville.com/politicole/feed/"
				/>
			),
			navigationOptions: {
				tabBarLabel: 'PoliticOle',
				tabBarIcon: TabBarIcon('megaphone'),
			},
		},

		KstoNewsView: {
			screen: ({navigation}) => (
				<NewsContainer
					mode="wp-json"
					name="KSTO"
					navigation={navigation}
					query={{per_page: 10, _embed: true}}
					thumbnail={newsImages.ksto}
					url="https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/"
				/>
			),
			navigationOptions: {
				tabBarLabel: 'KSTO',
				tabBarIcon: TabBarIcon('radio'),
			},
		},
	},
	{
		navigationOptions: {
			title: 'News',
		},
	},
)
