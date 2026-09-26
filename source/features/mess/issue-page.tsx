import * as React from 'react'
import {
	Button,
	Divider,
	HStack,
	LazyHStack,
	ScrollView,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	background,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {cardKicker, sectionCredit} from './lib/byline'
import {TAP_TARGET} from './lib/glyph-grid'
import {datelineText} from './lib/issues'
import {leadStory, shelvesOf, type Shelf} from './lib/shelves'
import {Dateline, Masthead} from './masthead'
import {PageLoading, PageNotice} from './page-notice'
import {faded, ink, messRed, wash} from './palette'
import {messIssueOptions} from './query'
import {RemotePhoto} from './remote-photo'
import {SECTION_HEADING} from './story-blocks'
import type {MessIssue, MessStory} from './types'
import {useOpenStory} from './use-open-story'

/** Names the lead story, every card, and every shelf's "All ›", for a UI test. */
export const LEAD_STORY_ID = 'mess-lead-story'
export const STORY_CARD_ID = 'mess-story-card'
export const SHELF_ALL_ID = 'mess-shelf-all'

/** The heading of the shelf of stories from no section the front page names. */
const MORE_SHELF = 'More'
const CARD_WIDTH = 160
/** A card's photo, cropped to 3:2. */
const CARD_PHOTO_HEIGHT = 107
/** A text-only card is about as tall as a card with a photo and three lines, so a shelf's cards line up. */
const TEXT_CARD_HEIGHT = 180

const PLAIN = buttonStyle('plain')
/** The whole label takes a tap, blank space and all. */
const WHOLE = [contentShape(shapes.rectangle())]
const LEAD_HEADLINE = [
	font({textStyle: 'title', design: 'serif', weight: 'bold'}),
	foregroundStyle(ink),
]
const LEAD_CREDIT = [font({textStyle: 'subheadline'}), foregroundStyle(faded)]
const ALL_LINK = [
	font({textStyle: 'subheadline', weight: 'semibold'}),
	foregroundStyle(messRed),
	frame({minWidth: TAP_TARGET, minHeight: TAP_TARGET}),
	contentShape(shapes.rectangle()),
]
const CARD = [frame({width: CARD_WIDTH, alignment: 'leading'}), contentShape(shapes.rectangle())]
const CARD_HEADLINE = [
	font({textStyle: 'subheadline', design: 'serif', weight: 'semibold'}),
	foregroundStyle(ink),
	lineLimit(3),
]
const TEXT_CARD = [
	padding({all: 10}),
	frame({width: CARD_WIDTH, height: TEXT_CARD_HEIGHT, alignment: 'topLeading'}),
	background(wash),
	contentShape(shapes.rectangle()),
]
const CARD_KICKER = [
	font({textStyle: 'caption', weight: 'bold', smallCaps: true}),
	foregroundStyle(messRed),
]
const TEXT_CARD_HEADLINE = [
	font({textStyle: 'headline', design: 'serif'}),
	foregroundStyle(ink),
	lineLimit(6),
]

type IssuePageProps = {
	issue: MessIssue
	columnWidth: number
	/** Shows a section's chip on the front page, for a shelf's "All ›" */
	onShowSection: (section: string) => void
	/** Whether the page opens under the masthead, as Top does, or with its dateline alone */
	showMasthead: boolean
}

/** One issue laid out as its front page: its dateline, its lead story, then a shelf per section. */
export function IssuePage({
	issue,
	columnWidth,
	onShowSection,
	showMasthead,
}: IssuePageProps): React.ReactNode {
	let stories = useQuery(messIssueOptions(issue))
	let dateline = datelineText(issue)
	return (
		<>
			{showMasthead ? <Masthead dateline={dateline} /> : <Dateline text={dateline} />}
			{stories.data ? (
				<IssueStories
					columnWidth={columnWidth}
					onShowSection={onShowSection}
					stories={stories.data}
				/>
			) : stories.isError ? (
				<PageNotice error={stories.error} onRetry={() => stories.refetch()} />
			) : (
				<PageLoading />
			)}
		</>
	)
}

type IssueStoriesProps = {
	/** Newest first, as WordPress lists them */
	stories: MessStory[]
	columnWidth: number
	onShowSection: (section: string) => void
}

/** Stories laid out as a front page: the lead, then a shelf of cards per section, in print order. */
export function IssueStories({
	stories,
	columnWidth,
	onShowSection,
}: IssueStoriesProps): React.ReactNode {
	let open = useOpenStory()
	let lead = leadStory(stories)
	return (
		<>
			{lead ? (
				<LeadStory columnWidth={columnWidth} onPress={() => open(lead)} story={lead} />
			) : null}
			{shelvesOf(stories, lead?.id).map((shelf) => (
				<ShelfRow
					key={shelf.section ?? MORE_SHELF}
					onOpen={open}
					onShowSection={onShowSection}
					shelf={shelf}
				/>
			))}
		</>
	)
}

type LeadStoryProps = {story: MessStory; columnWidth: number; onPress: () => void}

/** The lead: its photo at the column's width, a large headline, then its section and writers. */
function LeadStory({story, columnWidth, onPress}: LeadStoryProps): React.ReactNode {
	let credit = sectionCredit(story)
	return (
		<Button
			modifiers={[PLAIN, accessibilityLabel(story.title), accessibilityIdentifier(LEAD_STORY_ID)]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow in components/rows.tsx. */}
			<VStack alignment="leading" modifiers={WHOLE} spacing={8}>
				{story.photo ? (
					<RemotePhoto
						height={Math.round((columnWidth * story.photo.height) / story.photo.width)}
						url={story.photo.url}
						width={columnWidth}
					/>
				) : null}
				<Text modifiers={LEAD_HEADLINE}>{story.title}</Text>
				{credit ? <Text modifiers={LEAD_CREDIT}>{credit}</Text> : null}
			</VStack>
		</Button>
	)
}

type ShelfRowProps = {
	shelf: Shelf
	onOpen: (story: MessStory) => void
	onShowSection: (section: string) => void
}

/** A section's heading, with "All ›" for a section that has a chip, over a sideways row of cards. */
function ShelfRow({shelf, onOpen, onShowSection}: ShelfRowProps): React.ReactNode {
	let {section} = shelf
	return (
		<VStack alignment="leading" spacing={8}>
			<Divider />
			<HStack>
				<Text modifiers={SECTION_HEADING}>{section ?? MORE_SHELF}</Text>
				<Spacer />
				{section === null ? null : (
					<Button
						modifiers={[
							PLAIN,
							accessibilityLabel(`All ${section}`),
							accessibilityIdentifier(SHELF_ALL_ID),
						]}
						onPress={() => onShowSection(section)}
					>
						<Text modifiers={ALL_LINK}>All ›</Text>
					</Button>
				)}
			</HStack>
			<ScrollView axes="horizontal" showsIndicators={false}>
				<LazyHStack alignment="top" spacing={12}>
					{shelf.stories.map((story) => (
						<StoryCard key={story.id} onPress={() => onOpen(story)} story={story} />
					))}
				</LazyHStack>
			</ScrollView>
		</VStack>
	)
}

/**
 * A story on a shelf: its photo, then its headline. A story with no photo of its own, or only
 * the Mess logo, gets a tinted card headed by its column or section instead of the logo again.
 */
function StoryCard({story, onPress}: {story: MessStory; onPress: () => void}): React.ReactNode {
	let kicker = cardKicker(story)
	return (
		<Button
			modifiers={[PLAIN, accessibilityLabel(story.title), accessibilityIdentifier(STORY_CARD_ID)]}
			onPress={onPress}
		>
			{story.photo ? (
				<VStack alignment="leading" modifiers={CARD} spacing={6}>
					<RemotePhoto height={CARD_PHOTO_HEIGHT} url={story.photo.url} width={CARD_WIDTH} />
					<Text modifiers={CARD_HEADLINE}>{story.title}</Text>
				</VStack>
			) : (
				<VStack alignment="leading" modifiers={TEXT_CARD} spacing={6}>
					{kicker ? <Text modifiers={CARD_KICKER}>{kicker}</Text> : null}
					<Text modifiers={TEXT_CARD_HEADLINE}>{story.title}</Text>
				</VStack>
			)}
		</Button>
	)
}
