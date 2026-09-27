import * as React from 'react'
import {HStack, ProgressView, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	frame,
	id,
	kerning,
	onAppear,
	padding,
	textCase,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {MessIssueTile} from '@frogpond/mess-issue-tile'
import {
	leadParagraphs,
	readCount,
	rowsOf,
	sheetShape,
	stainCount,
	stainMarks,
	tileLabel,
	yearGroups,
} from './lib/issue-grid'
import {issueDate} from './lib/issues'
import {PageNotice} from './page-notice'
import {faded, ink} from './palette'
import {messIssueOptions, messLeadTextOptions} from './query'
import {useMessStore} from './store'
import type {MessIssue} from './types'
import type {MessIssuesQuery} from './use-mess-issues'

/** Names every grid tile, and the top tile, and every year's heading, for a UI test. */
export const ISSUE_TILE_ID = 'mess-issue-tile'
export const TOP_TILE_ID = 'mess-top-tile'
export const YEAR_HEADER_ID = 'mess-year-header'

const YEAR = [font({textStyle: 'title3', weight: 'bold'}), foregroundStyle(ink)]
const YEAR_COUNT = [
	font({textStyle: 'caption'}),
	textCase('uppercase'),
	kerning(0.6),
	foregroundStyle(faded),
]
const YEAR_ROW = [
	padding({top: 12}),
	accessibilityAddTraits(['isHeader']),
	accessibilityIdentifier(YEAR_HEADER_ID),
]
/** Each tile, and each gap in a short row, takes an equal share of the row. */
const SHARE = [frame({maxWidth: Infinity})]
/** A grid tile's columns hold nothing: only the top tile sets its lead story. */
const NO_PARAGRAPHS: string[] = []

type TileProps = {issue: MessIssue; onOpen: (issue: MessIssue) => void}

/** One issue's tile, stained by how much of it the reader has opened. */
function Tile({
	issue,
	onOpen,
	layout = 'grid',
	paragraphs = NO_PARAGRAPHS,
}: TileProps & {
	layout?: 'grid' | 'topPortrait' | 'topLandscape'
	paragraphs?: string[]
}): React.ReactNode {
	let opened = useMessStore((state) => state.openedStories)
	let kind = useMessStore((state) => state.stainKind)
	let read = React.useMemo(
		() => readCount(issue.storyIds, new Set(opened)),
		[issue.storyIds, opened],
	)
	let stains = stainMarks(issue.key, stainCount(read, issue.storyIds.length))
	return (
		<MessIssueTile
			accessibilityLabel={tileLabel(issue, read)}
			date={issueDate(issue.day)}
			layout={layout}
			onPress={() => onOpen(issue)}
			paragraphs={paragraphs}
			sheet={sheetShape(issue.key, layout !== 'grid')}
			photoUrl={issue.leadPhoto}
			special={issue.isSpecial}
			stainKind={kind}
			stains={stains}
			testID={layout === 'grid' ? ISSUE_TILE_ID : TOP_TILE_ID}
			title={issue.leadTitle}
		/>
	)
}

/** The newest issue across the top, set with its lead story; the query is shared with its page and saved for the next launch. */
function TopTile({issue, onOpen, landscape}: TileProps & {landscape: boolean}): React.ReactNode {
	let stories = useQuery(messIssueOptions(issue, {persist: true}))
	let lead = stories.data?.find((story) => story.id === issue.leadId)
	return (
		<Tile
			issue={issue}
			layout={landscape ? 'topLandscape' : 'topPortrait'}
			onOpen={onOpen}
			paragraphs={leadParagraphs(lead)}
		/>
	)
}

/** A grid tile with no photo, set with its lead story's words below its fold. */
function WordsTile({issue, onOpen}: TileProps): React.ReactNode {
	let words = useQuery(messLeadTextOptions(issue.leadId))
	return <Tile issue={issue} onOpen={onOpen} paragraphs={words.data ?? NO_PARAGRAPHS} />
}

/** A grid tile: its lead photo, or with none, its lead story's words. */
function GridTile({issue, onOpen}: TileProps): React.ReactNode {
	return issue.leadPhoto === null ? (
		<WordsTile issue={issue} onOpen={onOpen} />
	) : (
		<Tile issue={issue} onOpen={onOpen} />
	)
}

/** Tiles to a row: two on a phone held upright, four across a landscape screen. */
const PER_ROW = {portrait: 2, landscape: 4}

type Props = {
	issues: MessIssue[]
	query: MessIssuesQuery
	landscape: boolean
	onOpen: (issue: MessIssue) => void
}

/**
 * Every issue the loaded pages hold: the newest as the top tile, then the rest in rows under
 * their year, returned side by side to land in the page's lazy column so rows are built as they
 * scroll in. The row at the end fetches the next page as it comes into view; it takes a new
 * identity with each page, so it fetches again when a page adds too few issues to push it off the
 * screen; a failed page leaves the loaded issues and offers Try Again in its place.
 */
export function IssueGrid({issues, query, landscape, onOpen}: Props): React.ReactNode {
	let top = issues[0]
	let perRow = landscape ? PER_ROW.landscape : PER_ROW.portrait
	let pageCount = query.data?.pages.length ?? 0
	// Any fetch in flight, a refresh too, is left to finish: asking for the next page would
	// cancel it. The end row's id carries whether a fetch is in flight, so it appears again,
	// and asks, once that fetch settles.
	let fetchMore = () => (query.isFetching ? undefined : query.fetchNextPage())
	let endId = `issues-page-${pageCount}-${query.isFetching ? 'fetching' : 'settled'}`

	let end: React.ReactNode = null
	if (query.isFetchNextPageError) {
		end = <PageNotice error={query.error} onRetry={() => query.fetchNextPage()} />
	} else if (query.hasNextPage) {
		end = (
			// The id wraps the onAppear, so a new page rebuilds the view the onAppear sits on.
			<VStack modifiers={[onAppear(fetchMore), id(endId)]}>
				<ProgressView />
			</VStack>
		)
	}

	return (
		<>
			{top ? <TopTile issue={top} landscape={landscape} key={top.key} onOpen={onOpen} /> : null}
			{yearGroups(issues).flatMap((group) => [
				<HStack key={`year-${group.year}`} modifiers={YEAR_ROW}>
					<Text modifiers={YEAR}>{group.year}</Text>
					<Spacer />
					<Text
						modifiers={YEAR_COUNT}
					>{`${group.count} ${group.count === 1 ? 'issue' : 'issues'}`}</Text>
				</HStack>,
				...rowsOf(group.issues, perRow).map((row) => (
					<HStack alignment="top" key={row.map((each) => each.key).join('+')} spacing={12}>
						{row.map((each) => (
							<VStack key={each.key} modifiers={SHARE}>
								<GridTile issue={each} onOpen={onOpen} />
							</VStack>
						))}
						{/* A short last row keeps its tiles the width of a full row's. */}
						{Array.from({length: perRow - row.length}, (_, index) => (
							<Spacer key={`gap-${index}`} modifiers={SHARE} />
						))}
					</HStack>
				)),
			])}
			{end}
		</>
	)
}
