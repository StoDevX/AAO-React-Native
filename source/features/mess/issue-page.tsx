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
	accessibilityElement,
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
import {splitCarousel} from '../../lib/split-carousel'
import {cardKicker, sectionCredit} from './lib/byline'
import {TAP_TARGET} from './lib/glyph-grid'
import {rowsOf} from './lib/issue-grid'
import {keepsDarkMode} from './lib/photo-story'
import {leadStory, shelvesOf} from './lib/shelves'
import {PageLoading, PageNotice} from './page-notice'
import {faded, ink, messRed, wash} from './palette'
import {messIssueOptions} from './query'
import {RemotePhoto} from './remote-photo'
import {useMessStore} from './store'
import {SECTION_HEADING} from './story-blocks'
import type {MessIssue, MessStory} from './types'
import {useOpenStory} from './use-open-story'

/**
 * Names the lead story, every card, every shelf's "All ›", every More tile, and every row of the
 * More grid, for a UI test.
 */
export const LEAD_STORY_ID = 'mess-lead-story'
export const STORY_CARD_ID = 'mess-story-card'
export const SHELF_ALL_ID = 'mess-shelf-all'
export const SHELF_MORE_ID = 'mess-shelf-more'
export const MORE_GRID_ROW_ID = 'mess-more-grid-row'

/** The heading of the stories from no section the front page names. */
const MORE_SHELF = 'More'
/** A shelf card's width. */
const CARD_WIDTH = 160
/** A tinted card's inset, from its edge to its words. */
const CARD_PADDING = 10
/** The room under a card's photo for its headline's three lines. */
const HEADLINE_ROOM = 73
/** How many of the hidden headlines a shelf's More tile shows. */
const MORE_PREVIEW = 3
/** The More grid's cards to a row, and the gap between them, as the shelves space theirs. */
const GRID_COLUMNS = 2
const CARD_SPACING = 12

/**
 * A card's photo height, cropped to 3:2, and a text-only card's height: about as tall as a card
 * with a photo and three lines, so the cards in a row line up.
 */
function cardHeights(width: number): {photo: number; text: number} {
	let photo = Math.round((width * 2) / 3)
	return {photo, text: photo + HEADLINE_ROOM}
}

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
const CARD_HEADLINE = [
	font({textStyle: 'subheadline', design: 'serif', weight: 'semibold'}),
	foregroundStyle(ink),
	lineLimit(3),
]
/** The dark paper and ink a Photo story's card keeps whatever the system's appearance. */
const DARK_PAPER = '#1C1A17'
const DARK_INK = '#EDE8DF'
const DARK_CARD_HEADLINE = [
	font({textStyle: 'subheadline', design: 'serif', weight: 'semibold'}),
	foregroundStyle(DARK_INK),
	lineLimit(3),
]
/** A card with a photo set in a border of dark paper, `width` wide, inset like a text card. */
function darkPhotoCard(width: number) {
	return [
		padding({all: CARD_PADDING}),
		frame({width, alignment: 'leading'}),
		background(DARK_PAPER),
		contentShape(shapes.rectangle()),
	]
}
/** A card with a photo, `width` wide. */
function photoCard(width: number) {
	return [frame({width, alignment: 'leading'}), contentShape(shapes.rectangle())]
}
/** A tinted card with no photo, `width` wide. */
function textCard(width: number) {
	return [
		padding({all: CARD_PADDING}),
		frame({width, height: cardHeights(width).text, alignment: 'topLeading'}),
		background(wash),
		contentShape(shapes.rectangle()),
	]
}
const SHELF_TEXT_CARD = textCard(CARD_WIDTH)
/** A row of the More grid: a container, so its identifier leaves its cards' own alone. */
const GRID_ROW = [accessibilityElement('contain'), accessibilityIdentifier(MORE_GRID_ROW_ID)]
const CARD_KICKER = [
	font({textStyle: 'caption', weight: 'bold', smallCaps: true}),
	foregroundStyle(messRed),
]
const TEXT_CARD_HEADLINE = [
	font({textStyle: 'headline', design: 'serif'}),
	foregroundStyle(ink),
	lineLimit(6),
]
const MORE_HEADLINE = [
	font({textStyle: 'subheadline', design: 'serif'}),
	foregroundStyle(faded),
	lineLimit(2),
]
/**
 * A second inset under the count, so it sits as far above the tile's foot as a text card's kicker
 * sits below its top; with the card's inset alone, it sat almost on the edge.
 */
const MORE_COUNT = [
	font({textStyle: 'headline'}),
	foregroundStyle(messRed),
	padding({bottom: CARD_PADDING}),
]

type IssuePageProps = {
	issue: MessIssue
	columnWidth: number
	/** Opens the list of the issue's stories in a section, for a shelf's "All ›" and More tile */
	onShowSection: (section: string) => void
	/** Whether its stories are saved for the next launch, as the front page's top tile's are */
	persist?: boolean
}

/** One issue laid out as its front page: its lead story, then a shelf per section. */
export function IssuePage({
	issue,
	columnWidth,
	onShowSection,
	persist = false,
}: IssuePageProps): React.ReactNode {
	let stories = useQuery(messIssueOptions(issue, {persist}))
	return (
		<>
			{stories.data ? (
				<IssueStories
					columnWidth={columnWidth}
					leadId={issue.leadId}
					onShowSection={onShowSection}
					stories={stories.data}
				/>
			) : stories.isError ? (
				<PageNotice error={stories.error} onRetry={() => stories.refetch()} />
			) : (
				<PageLoading paused={stories.fetchStatus === 'paused'} />
			)}
		</>
	)
}

type IssueStoriesProps = {
	/** Newest first, as WordPress lists them */
	stories: MessStory[]
	/** The lead the issue list named, so the page agrees with its tile */
	leadId?: number
	columnWidth: number
	onShowSection: (section: string) => void
}

/**
 * Stories laid out as a front page: the lead, then a shelf of cards per section, in print order,
 * then the stories from no print section as a grid.
 */
export function IssueStories({
	stories,
	leadId,
	columnWidth,
	onShowSection,
}: IssueStoriesProps): React.ReactNode {
	let open = useOpenStory()
	let lead = stories.find((story) => story.id === leadId) ?? leadStory(stories)
	return (
		<>
			{lead ? (
				<LeadStory columnWidth={columnWidth} onPress={() => open(lead)} story={lead} />
			) : null}
			{shelvesOf(stories, lead?.id).map(({section, stories: shelved}) =>
				section === null ? (
					<MoreGrid columnWidth={columnWidth} key={MORE_SHELF} onOpen={open} stories={shelved} />
				) : (
					<ShelfRow
						key={section}
						onOpen={open}
						onShowSection={onShowSection}
						section={section}
						stories={shelved}
					/>
				),
			)}
		</>
	)
}

type LeadStoryProps = {story: MessStory; columnWidth: number; onPress: () => void}

/** The lead: its photo at the column's width, a large headline, then its section and writers. */
function LeadStory({story, columnWidth, onPress}: LeadStoryProps): React.ReactNode {
	let credit = sectionCredit(story)
	// Read as drawn: the headline, then the section and writers under it.
	let label = credit ? `${story.title}, ${credit}` : story.title
	return (
		<Button
			modifiers={[PLAIN, accessibilityLabel(label), accessibilityIdentifier(LEAD_STORY_ID)]}
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

type ShelfHeadingProps = {
	title: string
	/** Opens the section's list, for a section with "All ›" */
	onShowAll?: () => void
}

/** A shelf's or the More grid's heading, under a rule, with "All ›" at its end when it has one. */
function ShelfHeading({title, onShowAll}: ShelfHeadingProps): React.ReactNode {
	return (
		<>
			<Divider />
			<HStack>
				<Text modifiers={SECTION_HEADING}>{title}</Text>
				<Spacer />
				{onShowAll ? (
					<Button
						modifiers={[
							PLAIN,
							accessibilityLabel(`All ${title}`),
							accessibilityIdentifier(SHELF_ALL_ID),
						]}
						onPress={onShowAll}
					>
						<Text modifiers={ALL_LINK}>All ›</Text>
					</Button>
				) : null}
			</HStack>
		</>
	)
}

type ShelfRowProps = {
	section: string
	stories: MessStory[]
	onOpen: (story: MessStory) => void
	onShowSection: (section: string) => void
}

/**
 * A section's heading, with "All ›", over a sideways row of cards. A long row stops after six
 * cards and ends with a More tile.
 */
function ShelfRow({section, stories, onOpen, onShowSection}: ShelfRowProps): React.ReactNode {
	let {shown, hidden} = splitCarousel(stories)
	return (
		<VStack alignment="leading" spacing={8}>
			<ShelfHeading onShowAll={() => onShowSection(section)} title={section} />
			<ScrollView axes="horizontal" showsIndicators={false}>
				<LazyHStack alignment="top" spacing={CARD_SPACING}>
					{shown.map((story) => (
						<StoryCard key={story.id} onPress={() => onOpen(story)} story={story} />
					))}
					{hidden.length > 0 ? (
						<MoreTile hidden={hidden} onPress={() => onShowSection(section)} section={section} />
					) : null}
				</LazyHStack>
			</ScrollView>
		</VStack>
	)
}

type MoreGridProps = {
	stories: MessStory[]
	columnWidth: number
	onOpen: (story: MessStory) => void
}

/**
 * The stories from no print section, every one, as a grid of cards two to a row under the More
 * heading. It comes last, so nothing waits below it, and a special edition, whose stories are all
 * here, shows its whole issue. Returned side by side to land in the page's lazy column, so rows
 * are built as they scroll in.
 */
function MoreGrid({stories, columnWidth, onOpen}: MoreGridProps): React.ReactNode {
	let width = Math.floor((columnWidth - CARD_SPACING * (GRID_COLUMNS - 1)) / GRID_COLUMNS)
	return (
		<>
			<VStack alignment="leading" spacing={8}>
				<ShelfHeading title={MORE_SHELF} />
			</VStack>
			{rowsOf(stories, GRID_COLUMNS).map((row) => (
				<HStack
					alignment="top"
					key={row.map((story) => story.id).join('-')}
					modifiers={GRID_ROW}
					spacing={CARD_SPACING}
				>
					{row.map((story) => (
						<StoryCard key={story.id} onPress={() => onOpen(story)} story={story} width={width} />
					))}
				</HStack>
			))}
		</>
	)
}

type MoreTileProps = {
	/** The stories the shelf left out, in order */
	hidden: MessStory[]
	section: string
	onPress: () => void
}

/**
 * The tile that ends a shelf with more than it shows, as Maps ends a place card's carousel: the
 * next few headlines it left out, then a count that opens the same list as the heading's "All ›".
 * Drawn as a text card, so it lines up with the shelf's other cards.
 */
function MoreTile({hidden, section, onPress}: MoreTileProps): React.ReactNode {
	return (
		<Button
			modifiers={[
				PLAIN,
				accessibilityLabel(`${hidden.length} more ${section} stories`),
				accessibilityIdentifier(SHELF_MORE_ID),
			]}
			onPress={onPress}
		>
			<VStack alignment="leading" modifiers={SHELF_TEXT_CARD} spacing={6}>
				{hidden.slice(0, MORE_PREVIEW).map((story) => (
					<Text key={story.id} modifiers={MORE_HEADLINE}>
						{story.title}
					</Text>
				))}
				<Spacer />
				<Text modifiers={MORE_COUNT}>{`${hidden.length} more ›`}</Text>
			</VStack>
		</Button>
	)
}

type StoryCardProps = {
	story: MessStory
	/** A shelf's cards are all one width; the More grid's share the column */
	width?: number
	onPress: () => void
}

/**
 * A story on a shelf or in the More grid: its photo, then its headline. A story with no photo of
 * its own, or only the Mess logo, gets a tinted card headed by its column or section instead of
 * the logo again.
 */
function StoryCard({story, width = CARD_WIDTH, onPress}: StoryCardProps): React.ReactNode {
	let kicker = cardKicker(story)
	let keepPhotoStoriesDark = useMessStore((state) => state.keepPhotoStoriesDark)
	let dark = keepsDarkMode(story, keepPhotoStoriesDark)
	// A dark card insets its photo by the border, so the card stays `width` wide.
	let photoWidth = dark ? width - CARD_PADDING * 2 : width
	// A text card draws its column or section; a photo card draws its headline alone.
	let label = !story.photo && kicker ? `${story.title}, ${kicker}` : story.title
	return (
		<Button
			modifiers={[PLAIN, accessibilityLabel(label), accessibilityIdentifier(STORY_CARD_ID)]}
			onPress={onPress}
		>
			{story.photo ? (
				<VStack
					alignment="leading"
					modifiers={dark ? darkPhotoCard(width) : photoCard(width)}
					spacing={6}
				>
					<RemotePhoto
						height={cardHeights(photoWidth).photo}
						url={story.photo.url}
						width={photoWidth}
					/>
					<Text modifiers={dark ? DARK_CARD_HEADLINE : CARD_HEADLINE}>{story.title}</Text>
				</VStack>
			) : (
				<VStack alignment="leading" modifiers={textCard(width)} spacing={6}>
					{kicker ? <Text modifiers={CARD_KICKER}>{kicker}</Text> : null}
					<Text modifiers={TEXT_CARD_HEADLINE}>{story.title}</Text>
				</VStack>
			)}
		</Button>
	)
}
