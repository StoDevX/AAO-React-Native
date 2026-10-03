import * as React from 'react'
import {HStack, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	frame,
	kerning,
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
import {NextPageRow} from './next-page-row'
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

type TileProps = {
	issue: MessIssue
	/** How many of the issue's stories the reader has opened */
	read: number
	onOpen: (issue: MessIssue) => void
}

/**
 * One issue's tile, stained by how much of it the reader has opened. Memoized, as its props cross
 * to the native view on every render: opening a story changes one issue's read count, and draws
 * that issue's tile alone again.
 */
const Tile = React.memo(function Tile({
	issue,
	read,
	onOpen,
	layout = 'grid',
	paragraphs = NO_PARAGRAPHS,
}: TileProps & {
	layout?: 'grid' | 'topPortrait' | 'topLandscape'
	paragraphs?: string[]
}): React.ReactNode {
	let kind = useMessStore((state) => state.stainKind)
	let photoTone = useMessStore((state) => state.photoTone)
	let count = stainCount(read, issue.storyIds.length)
	let stains = React.useMemo(() => stainMarks(issue.key, count), [issue.key, count])
	let isTop = layout !== 'grid'
	let sheet = React.useMemo(() => sheetShape(issue.key, isTop), [issue.key, isTop])
	return (
		<MessIssueTile
			accessibilityLabel={tileLabel(issue, read)}
			date={issueDate(issue.day)}
			layout={layout}
			onPress={() => onOpen(issue)}
			paragraphs={paragraphs}
			photoTone={photoTone}
			sheet={sheet}
			hasPhoto={issue.leadHasPhoto}
			photoUrl={issue.leadPhoto}
			special={issue.isSpecial}
			stainKind={kind}
			stains={stains}
			testID={layout === 'grid' ? ISSUE_TILE_ID : TOP_TILE_ID}
			title={issue.leadTitle}
		/>
	)
})

/** The newest issue across the top, set with its lead story; the query is shared with its page and saved for the next launch. */
const TopTile = React.memo(function TopTile({
	issue,
	read,
	onOpen,
	landscape,
}: TileProps & {landscape: boolean}): React.ReactNode {
	let stories = useQuery(messIssueOptions(issue, {persist: true}))
	let lead = stories.data?.find((story) => story.id === issue.leadId)
	let paragraphs = React.useMemo(() => leadParagraphs(lead), [lead])
	return (
		<Tile
			issue={issue}
			layout={landscape ? 'topLandscape' : 'topPortrait'}
			onOpen={onOpen}
			paragraphs={paragraphs}
			read={read}
		/>
	)
})

/** A grid tile with no photo, set with its lead story's words below its fold. */
function WordsTile({issue, read, onOpen}: TileProps): React.ReactNode {
	let words = useQuery(messLeadTextOptions(issue.leadId))
	return <Tile issue={issue} onOpen={onOpen} paragraphs={words.data ?? NO_PARAGRAPHS} read={read} />
}

/**
 * A grid tile: its lead photo, or with none, its lead story's words. A lead whose photo's address
 * was not found is still a lead with a photo, and is not given words.
 */
const GridTile = React.memo(function GridTile({issue, read, onOpen}: TileProps): React.ReactNode {
	return !issue.leadHasPhoto ? (
		<WordsTile issue={issue} onOpen={onOpen} read={read} />
	) : (
		<Tile issue={issue} onOpen={onOpen} read={read} />
	)
})

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
 * scroll in. The row at the end fetches the next page as it comes into view.
 */
export function IssueGrid({issues, query, landscape, onOpen}: Props): React.ReactNode {
	let top = issues[0]
	let opened = useMessStore((state) => state.openedStories)
	let openedIds = React.useMemo(() => new Set(opened), [opened])
	let perRow = landscape ? PER_ROW.landscape : PER_ROW.portrait

	return (
		<>
			{top ? (
				<TopTile
					issue={top}
					key={top.key}
					landscape={landscape}
					onOpen={onOpen}
					read={readCount(top.storyIds, openedIds)}
				/>
			) : null}
			{yearGroups(issues).flatMap((group) => [
				<HStack key={`year-${group.year}`} modifiers={YEAR_ROW}>
					<Text modifiers={YEAR}>{group.year}</Text>
					<Spacer />
					<Text
						modifiers={YEAR_COUNT}
					>{`${group.count} ${group.count === 1 ? 'issue' : 'issues'}`}</Text>
				</HStack>,
				// A row is named by its place in its year, so a new issue pushing each tile along a slot
				// keeps the rows, and a tile that stays in its row keeps its native view and photo.
				...rowsOf(group.issues, perRow).map((row, index) => (
					// oxlint-disable-next-line react/no-array-index-key -- the row's place is its identity, as above
					<HStack alignment="top" key={`${group.year}-${index}`} spacing={12}>
						{row.map((each) => (
							<VStack key={each.key} modifiers={SHARE}>
								<GridTile issue={each} onOpen={onOpen} read={readCount(each.storyIds, openedIds)} />
							</VStack>
						))}
						{/* A short last row keeps its tiles the width of a full row's. */}
						{Array.from({length: perRow - row.length}, (_, index) => (
							<Spacer key={`gap-${index}`} modifiers={SHARE} />
						))}
					</HStack>
				)),
			])}
			<NextPageRow query={query} />
		</>
	)
}
