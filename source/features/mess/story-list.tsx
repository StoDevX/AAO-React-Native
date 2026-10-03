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
import {
	useInfiniteQuery,
	type InfiniteData,
	type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import {openUrl} from '@frogpond/open-url'
import {destinationTraits, RowAccessory} from '../../components/rows'
import {creditLine} from './lib/byline'
import {crosswordUrl} from './lib/crossword'
import {TAP_TARGET} from './lib/glyph-grid'
import {NextPageRow} from './next-page-row'
import {PageLoading, PageNotice} from './page-notice'
import {faded, ink, wash} from './palette'
import {messCategoryOptions} from './query'
import {RemotePhoto} from './remote-photo'
import {useMessStore} from './store'
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

type StoryRowProps = {
	story: MessStory
	onPress: () => void
	/** Whether the tap opens a page outside the app, which the row then points to as a row does */
	external: boolean
}

/** A story in a list: its photo or a tinted square, its headline, then its writers and date. */
function StoryRow({story, onPress, external}: StoryRowProps): React.ReactNode {
	let credit = creditLine(story, 'short')
	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(`${story.title}, ${credit}`),
				accessibilityIdentifier(`${STORY_ROW_PREFIX}${story.id}`),
				...destinationTraits(external ? 'external' : 'push'),
			]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow in components/rows.tsx. */}
			<HStack modifiers={ROW} spacing={12}>
				<HStack alignment="top" spacing={12}>
					{story.photo ? (
						<RemotePhoto height={THUMBNAIL} url={story.photo.url} width={THUMBNAIL} />
					) : (
						<Rectangle modifiers={BLANK} />
					)}
					<VStack alignment="leading" spacing={2}>
						<Text modifiers={HEADLINE}>{story.title}</Text>
						<Text modifiers={CREDIT}>{credit}</Text>
					</VStack>
				</HStack>
				<Spacer />
				{/* A row into the reader draws no chevron; only one that leaves the app says so. */}
				{external ? <RowAccessory destination="external" /> : null}
			</HStack>
		</Button>
	)
}

/**
 * Stories as rows, each opening in the reader; returned side by side to land in the page's column.
 * A list of nothing but crosswords, as the Crossword column is, opens each puzzle from its row,
 * since solving it is all a crossword's page is for.
 */
export function StoryRows({stories}: {stories: MessStory[]}): React.ReactNode {
	let open = useOpenStory()
	let recordOpened = useMessStore((state) => state.recordOpened)
	if (stories.length === 0) return <Text modifiers={EMPTY}>No stories yet</Text>
	let onlyCrosswords = stories.every((story) => story.layout.kind === 'crossword')
	let press = (story: MessStory) => {
		if (onlyCrosswords && story.layout.kind === 'crossword') {
			// The reader's page would have counted it towards its issue's stains.
			recordOpened(story.id)
			openUrl(crosswordUrl(story.layout.puzzle))
		} else {
			open(story)
		}
	}
	return stories.map((story) => (
		<VStack alignment="leading" key={story.id} spacing={10}>
			<StoryRow external={onlyCrosswords} onPress={() => press(story)} story={story} />
			<Divider />
		</VStack>
	))
}

/** A list's stories as rows, a page at a time, with the next page loaded as the end comes into view. */
export function PagedStoryRows({
	query,
}: {
	query: UseInfiniteQueryResult<InfiniteData<MessStory[]>>
}): React.ReactNode {
	if (query.data === undefined) {
		return query.isError ? (
			<PageNotice error={query.error} onRetry={() => query.refetch()} />
		) : (
			<PageLoading paused={query.fetchStatus === 'paused'} />
		)
	}
	return (
		<>
			<StoryRows stories={query.data.pages.flat()} />
			<NextPageRow query={query} />
		</>
	)
}

/** A section's or column's newest stories, a row each. */
export function CategoryStories({categoryId}: {categoryId: number}): React.ReactNode {
	return <PagedStoryRows query={useInfiniteQuery(messCategoryOptions(categoryId))} />
}
