import * as React from 'react'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'
import {useNavigation} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'

import type {RedditPostType} from './types'
import {redditPostsOptions} from './query'
import {PostList} from './post-list'

export {
	PostDetailView,
	NavigationKey as PostDetailNavigationKey,
	NavigationOptions as PostDetailNavigationOptions,
} from './post-detail'

type TabParams = {
	StOlafFeed: undefined
	CarletonFeed: undefined
}

const Tab = createNativeBottomTabNavigator<TabParams>()

function StOlafFeedScreen(): React.ReactNode {
	const navigation = useNavigation()
	const query = useQuery(redditPostsOptions('stolaf'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			navigation.navigate('RedditPostDetail', {
				postUrl: post.permalink,
				title: post.title,
				author: post.author,
				publishedAt: post.publishedAt,
				contentHtml: post.contentHtml,
				thumbnail: post.thumbnail,
				communityName: 'St. Olaf',
				postAuthor: post.author,
			})
		},
		[navigation],
	)

	return <PostList onPressPost={handlePressPost} query={query} />
}

function CarletonFeedScreen(): React.ReactNode {
	const navigation = useNavigation()
	const query = useQuery(redditPostsOptions('carletoncollege'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			navigation.navigate('RedditPostDetail', {
				postUrl: post.permalink,
				title: post.title,
				author: post.author,
				publishedAt: post.publishedAt,
				contentHtml: post.contentHtml,
				thumbnail: post.thumbnail,
				communityName: 'Carleton',
				postAuthor: post.author,
			})
		},
		[navigation],
	)

	return <PostList onPressPost={handlePressPost} query={query} />
}

export const View = (): React.ReactNode => (
	<Tab.Navigator screenOptions={{headerShown: false}}>
		<Tab.Screen
			component={StOlafFeedScreen}
			name="StOlafFeed"
			options={{
				tabBarLabel: 'r/stolaf',
				tabBarIcon: {type: 'sfSymbol', name: 'person.2.fill'},
			}}
		/>
		<Tab.Screen
			component={CarletonFeedScreen}
			name="CarletonFeed"
			options={{
				tabBarLabel: 'r/carletoncollege',
				tabBarIcon: {type: 'sfSymbol', name: 'building.columns.fill'},
			}}
		/>
	</Tab.Navigator>
)

export type NavigationParams = undefined
export const NavigationKey = 'Communities'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Communities',
}
