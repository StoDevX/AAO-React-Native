import * as React from 'react'
import {Button, Divider, HStack, Rectangle, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {creditLine} from './lib/byline'
import {TAP_TARGET} from './lib/glyph-grid'
import {PageLoading, PageNotice} from './page-notice'
import {faded, ink, wash} from './palette'
import {messCategoryOptions} from './query'
import {RemotePhoto} from './remote-photo'
import type {MessStory} from './types'
import {useOpenStory} from './use-open-story'

/** Every story row's identifier starts with this, followed by its post id, for a UI test. */
export const STORY_ROW_PREFIX = 'mess-row-'

const THUMBNAIL = 56
/** The whole row takes a tap, and is never shorter than a comfortable target. */
const ROW = [frame({minHeight: TAP_TARGET}), contentShape(shapes.rectangle())]
/** Where a story has no photo, a tinted square keeps the rows even. */
const BLANK = [foregroundStyle(wash), frame({width: THUMBNAIL, height: THUMBNAIL})]
const HEADLINE = [
	font({textStyle: 'headline', design: 'serif'}),
	foregroundStyle(ink),
	lineLimit(3),
]
const CREDIT = [font({textStyle: 'caption'}), foregroundStyle(faded)]
const EMPTY = [font({textStyle: 'callout'}), foregroundStyle(faded)]

/** A story in a list: its photo or a tinted square, its headline, then its writers and date. */
function StoryRow({story, onPress}: {story: MessStory; onPress: () => void}): React.ReactNode {
	let credit = creditLine(story, 'short')
	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(`${story.title}, ${credit}`),
				accessibilityIdentifier(`${STORY_ROW_PREFIX}${story.id}`),
			]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow in components/rows.tsx. */}
			<HStack alignment="top" modifiers={ROW} spacing={12}>
				{story.photo ? (
					<RemotePhoto height={THUMBNAIL} url={story.photo.url} width={THUMBNAIL} />
				) : (
					<Rectangle modifiers={BLANK} />
				)}
				<VStack alignment="leading" spacing={2}>
					<Text modifiers={HEADLINE}>{story.title}</Text>
					<Text modifiers={CREDIT}>{credit}</Text>
				</VStack>
				<Spacer />
			</HStack>
		</Button>
	)
}

/** Stories as rows, each opening in the reader; returned side by side to land in the page's column. */
export function StoryRows({stories}: {stories: MessStory[]}): React.ReactNode {
	let open = useOpenStory()
	if (stories.length === 0) return <Text modifiers={EMPTY}>No stories yet</Text>
	return stories.map((story) => (
		<VStack alignment="leading" key={story.id} spacing={10}>
			<StoryRow onPress={() => open(story)} story={story} />
			<Divider />
		</VStack>
	))
}

/** A section's or column's newest stories, a row each. */
export function CategoryStories({categoryId}: {categoryId: number}): React.ReactNode {
	let stories = useQuery(messCategoryOptions(categoryId))
	if (stories.data === undefined) {
		return stories.isError ? (
			<PageNotice error={stories.error} onRetry={() => stories.refetch()} />
		) : (
			<PageLoading paused={stories.fetchStatus === 'paused'} />
		)
	}
	return <StoryRows stories={stories.data} />
}
