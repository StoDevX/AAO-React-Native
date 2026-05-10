import * as React from 'react'
import {StyleSheet, View as RNView} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'
import {useNavigation} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import {ContextMenu} from '@frogpond/context-menu'
import * as c from '@frogpond/colors'

import type {RedditPostType} from './types'
import {redditPostsOptions} from './query'
import {PostList, type PostListVariant} from './post-list'
import {NavigationKey as PostDetailNavigationKey} from './post-detail'
import {useRedditPreferences} from './store'

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

const VARIANT_LABELS: Record<PostListVariant, string> = {
	A: 'Polished List',
	B: 'Card Feed',
	C: 'Hero + Cards',
}
const LABEL_TO_VARIANT: Record<string, PostListVariant> = {
	'Polished List': 'A',
	'Card Feed': 'B',
	'Hero + Cards': 'C',
}
const VARIANT_ACTIONS = Object.keys(LABEL_TO_VARIANT)

function StOlafFeedScreen(): React.ReactNode {
	const navigation = useNavigation()
	const {variant} = useRedditPreferences()
	const query = useQuery(redditPostsOptions('stolaf'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			navigation.navigate(PostDetailNavigationKey, {
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

	return (
		<PostList onPressPost={handlePressPost} query={query} variant={variant} />
	)
}

function CarletonFeedScreen(): React.ReactNode {
	const navigation = useNavigation()
	const {variant} = useRedditPreferences()
	const query = useQuery(redditPostsOptions('carletoncollege'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			navigation.navigate(PostDetailNavigationKey, {
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

	return (
		<PostList onPressPost={handlePressPost} query={query} variant={variant} />
	)
}

function VariantPickerButton(): React.ReactNode {
	const {variant, setVariant} = useRedditPreferences()

	return (
		<ContextMenu
			actions={VARIANT_ACTIONS}
			isMenuPrimaryAction={true}
			onPressMenuItem={(label) => {
				const next = LABEL_TO_VARIANT[label]
				if (next) setVariant(next)
			}}
			selectedAction={VARIANT_LABELS[variant]}
			title="Feed Style"
		>
			<RNView style={styles.headerButton}>
				<Icon color={c.link} name="grid-outline" size={22} />
			</RNView>
		</ContextMenu>
	)
}

export const View = (): React.ReactNode => {
	const navigation = useNavigation()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => <VariantPickerButton />,
		})
	}, [navigation])

	return (
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
}

const styles = StyleSheet.create({
	headerButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
})

export type NavigationParams = undefined
export const NavigationKey = 'Communities'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Communities',
}
