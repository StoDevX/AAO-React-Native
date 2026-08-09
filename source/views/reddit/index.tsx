import * as React from 'react'
import {useRouter} from 'expo-router'
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
import {useRedditPreferences} from './store'

export {PostDetailView} from './post-detail'

const VARIANT_LABELS: Record<PostListVariant, string> = {
	A: 'Compact List',
	C: 'Card Feed',
}
const LABEL_TO_VARIANT: Record<string, PostListVariant> = {
	'Compact List': 'A',
	'Card Feed': 'C',
}
const VARIANT_ACTIONS = Object.keys(LABEL_TO_VARIANT)

export function StOlafFeedScreen(): React.ReactNode {
	const router = useRouter()
	const {variant} = useRedditPreferences()
	const query = useQuery(redditPostsOptions('stolaf'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			router.push({
				pathname: '/RedditPostDetail',
				params: {postUrl: post.permalink, communityName: 'St. Olaf'},
			})
		},
		[router],
	)

	return (
		<PostList onPressPost={handlePressPost} query={query} variant={variant} />
	)
}

export function CarletonFeedScreen(): React.ReactNode {
	const router = useRouter()
	const {variant} = useRedditPreferences()
	const query = useQuery(redditPostsOptions('carletoncollege'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			router.push({
				pathname: '/RedditPostDetail',
				params: {postUrl: post.permalink, communityName: 'Carleton'},
			})
		},
		[router],
	)

	return (
		<PostList onPressPost={handlePressPost} query={query} variant={variant} />
	)
}

export function VariantPickerButton(): React.ReactNode {
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
