import * as React from 'react'
import {
	Button,
	Divider,
	HStack,
	ProgressView,
	Rectangle,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	id,
	lineLimit,
	onAppear,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {TAP_TARGET} from './lib/glyph-grid'
import {issueName} from './lib/issues'
import {PageNotice} from './page-notice'
import {faded, ink, messRed, wash} from './palette'
import {RemotePhoto} from './remote-photo'
import type {MessIssue} from './types'
import type {MessIssuesQuery} from './use-mess-issues'

/** Names every issue row, for a UI test. */
export const ISSUE_ROW_ID = 'mess-issue-row'

const THUMBNAIL = 64
/** The whole row takes a tap, and is never shorter than a comfortable target. */
const ROW = [frame({minHeight: TAP_TARGET}), contentShape(shapes.rectangle())]
/** Where a lead has no photo, a tinted square keeps the rows even. */
const BLANK = [foregroundStyle(wash), frame({width: THUMBNAIL, height: THUMBNAIL})]
const ISSUE_DATE = [
	font({textStyle: 'caption', weight: 'bold', smallCaps: true}),
	foregroundStyle(messRed),
]
const LEAD_TITLE = [
	font({textStyle: 'headline', design: 'serif'}),
	foregroundStyle(ink),
	lineLimit(3),
]
const COUNT = [font({textStyle: 'caption'}), foregroundStyle(faded)]

/** An issue: its lead's photo, its date, its lead headline and how many stories it holds. */
function IssueRow({issue, onPress}: {issue: MessIssue; onPress: () => void}): React.ReactNode {
	let name = issueName(issue)
	let count = `${issue.count} stories`
	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(`${name}, ${issue.leadTitle}, ${count}`),
				accessibilityIdentifier(ISSUE_ROW_ID),
			]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow in components/rows.tsx. */}
			<HStack alignment="top" modifiers={ROW} spacing={12}>
				{issue.leadPhoto ? (
					<RemotePhoto height={THUMBNAIL} url={issue.leadPhoto} width={THUMBNAIL} />
				) : (
					<Rectangle modifiers={BLANK} />
				)}
				<VStack alignment="leading" spacing={2}>
					<Text modifiers={ISSUE_DATE}>{name}</Text>
					<Text modifiers={LEAD_TITLE}>{issue.leadTitle}</Text>
					<Text modifiers={COUNT}>{count}</Text>
				</VStack>
				<Spacer />
			</HStack>
		</Button>
	)
}

type Props = {
	issues: MessIssue[]
	query: MessIssuesQuery
	onOpen: (issue: MessIssue) => void
}

/**
 * Every issue the loaded pages hold, newest first; returned side by side to land in the page's
 * column. The row at the end fetches the next page as it comes into view. It takes a new
 * identity with each page, so it fetches again when a page adds too few issues to push it off
 * the screen; a failed page leaves the loaded issues and offers Try Again in its place.
 */
export function IssueList({issues, query, onOpen}: Props): React.ReactNode {
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
			{issues.map((issue) => (
				<VStack alignment="leading" key={issue.day} spacing={10}>
					<IssueRow issue={issue} onPress={() => onOpen(issue)} />
					<Divider />
				</VStack>
			))}
			{end}
		</>
	)
}
