import * as React from 'react'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {createNativeBottomTabNavigator} from '@react-navigation/bottom-tabs/unstable'
import {useNavigation} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import IoniconGlyphs from '@react-native-vector-icons/ionicons/glyphmaps/Ionicons.json'
import {
	Host,
	Menu,
	Section,
	Text as SwiftUIText,
	Toggle,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	contentShape,
	font,
	foregroundColor,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

/// The Ionicons glyphs come from the app-wide font registered through
/// `UIAppFonts` in Info.plist; SwiftUI addresses it by its family name.
const ICON_FONT_FAMILY = 'Ionicons'
const VARIANT_ICON_SIZE = 22
/// Matches TestIdentifiers.Reddit in the XCUITest target.
const VARIANT_PICKER_TEST_ID = 'reddit-variant-picker'

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
	A: 'Compact List',
	C: 'Card Feed',
}
const LABEL_TO_VARIANT: Record<string, PostListVariant> = {
	'Compact List': 'A',
	'Card Feed': 'C',
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
				postType: post.postType,
				imageUrl: post.imageUrl,
				images: post.images,
				linkUrl: post.linkUrl,
				linkDomain: post.linkDomain,
				crosspostParent: post.crosspostParent,
				pollData: post.pollData,
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
				postType: post.postType,
				imageUrl: post.imageUrl,
				images: post.images,
				linkUrl: post.linkUrl,
				linkDomain: post.linkDomain,
				crosspostParent: post.crosspostParent,
				pollData: post.pollData,
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
		// SwiftUI all the way down: hosting the React Native icon here would put
		// the trigger behind a boundary the UI tests cannot address.
		<Host matchContents={true}>
			<Menu
				label={
					<SwiftUIText
						modifiers={[
							padding({horizontal: 8, vertical: 4}),
							contentShape(shapes.rectangle()),
							font({family: ICON_FONT_FAMILY, size: VARIANT_ICON_SIZE}),
							foregroundColor(c.link),
							accessibilityIdentifier(VARIANT_PICKER_TEST_ID),
						]}
					>
						{String.fromCodePoint(IoniconGlyphs['grid-outline'])}
					</SwiftUIText>
				}
			>
				<Section title="Feed Style">
					{VARIANT_ACTIONS.map((label) => (
						<Toggle
							key={label}
							isOn={label === VARIANT_LABELS[variant]}
							label={label}
							onIsOnChange={() => {
								const next = LABEL_TO_VARIANT[label]
								if (next) setVariant(next)
							}}
						/>
					))}
				</Section>
			</Menu>
		</Host>
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

export type NavigationParams = undefined
export const NavigationKey = 'Communities'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Communities',
}
