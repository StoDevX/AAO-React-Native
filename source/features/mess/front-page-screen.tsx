import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {Button, HStack, Spacer, Text, VStack} from '@expo/ui/swift-ui'
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
	textCase,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {RowAccessory} from '../../components/rows'
import {OLAF_MESSENGER} from '../news/sources'
import {useNewsFilterStore} from '../news/store'
import {ChipRow} from './chip-row'
import {IssueList} from './issue-list'
import {IssuePage, IssueStories} from './issue-page'
import {chipKey, chipOf, type MessChip} from './lib/chips'
import {TAP_TARGET} from './lib/glyph-grid'
import {bannerKicker, topOf} from './lib/issues'
import {messKeys} from './lib/keys'
import {Masthead} from './masthead'
import {MessPage, PAGE_MARGIN} from './mess-page'
import {PageLoading, PageNotice} from './page-notice'
import {ink, messRed, wash} from './palette'
import {messFeedOptions} from './query'
import {SectionPage} from './section-page'
import type {MessIssue} from './types'
import {useColumnWidth} from './use-column-width'
import {useMessIssues} from './use-mess-issues'

/** Top's dateline when it falls back to the feed. */
const LATEST_STORIES = 'Latest stories'
/** The Issues chip's dateline. */
const EVERY_ISSUE = 'Every issue'

/** Names Top's banner for a newer special edition, for a UI test. */
export const SPECIAL_BANNER_ID = 'mess-special-banner'

/** The banner takes a tap across its whole width, and is never shorter than a comfortable target. */
const BANNER = [
	padding({all: 10}),
	frame({maxWidth: Infinity, minHeight: TAP_TARGET, alignment: 'leading'}),
	background(wash),
	contentShape(shapes.rectangle()),
]
/** Set in capitals by SwiftUI, so VoiceOver reads the words rather than spelling them. */
const BANNER_KICKER = [
	font({textStyle: 'caption', weight: 'bold'}),
	textCase('uppercase'),
	foregroundStyle(messRed),
]
const BANNER_TITLE = [
	font({textStyle: 'headline', design: 'serif'}),
	foregroundStyle(ink),
	lineLimit(2),
]

/**
 * The Mess's front page: the chips pinned under the navigation bar, then the chosen chip's
 * page under the masthead. The chosen chip is remembered in the news filter store.
 */
export function FrontPageScreen(): React.ReactNode {
	let queryClient = useQueryClient()
	let saved = useNewsFilterStore((state) => state.selectedCategories[OLAF_MESSENGER.id] ?? null)
	let select = useNewsFilterStore((state) => state.select)
	let chip = chipOf(saved)
	let columnWidth = useColumnWidth(PAGE_MARGIN)

	let choose = (next: MessChip) => select(OLAF_MESSENGER.id, chipKey(next))
	let showSection = (name: string) => choose({kind: 'section', name})

	let page: React.ReactNode
	if (chip.kind === 'top') page = <TopPage columnWidth={columnWidth} onShowSection={showSection} />
	else if (chip.kind === 'issues') page = <IssuesPage />
	else page = <SectionPage name={chip.name} />

	return (
		<>
			<Stack.Screen options={{title: OLAF_MESSENGER.title}} />
			<MessPage
				// Only the chip showing has queries mounted, so refetching the active Mess queries
				// refreshes that chip alone.
				onRefresh={() => queryClient.refetchQueries({queryKey: messKeys.all, type: 'active'})}
				pinned={<ChipRow chosen={chip} onChoose={choose} />}
			>
				{page}
			</MessPage>
		</>
	)
}

/** A row above Top's dateline naming a special edition newer than Top; it opens that issue. */
function SpecialEditionBanner({issue}: {issue: MessIssue}): React.ReactNode {
	let router = useRouter()
	let kicker = bannerKicker(issue)
	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(`${kicker}, ${issue.leadTitle}`),
				accessibilityIdentifier(SPECIAL_BANNER_ID),
			]}
			onPress={() => router.navigate({pathname: '/Messenger/issue', params: {day: issue.day}})}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow in components/rows.tsx. */}
			<HStack modifiers={BANNER} spacing={12}>
				<VStack alignment="leading" spacing={2}>
					<Text modifiers={BANNER_KICKER}>{kicker}</Text>
					<Text modifiers={BANNER_TITLE}>{issue.leadTitle}</Text>
				</VStack>
				<Spacer />
				<RowAccessory destination="push" />
			</HStack>
		</Button>
	)
}

type TopPageProps = {columnWidth: number; onShowSection: (section: string) => void}

/**
 * The newest regular issue as a front page, under a banner for any special edition newer than
 * it. With no regular issue to show -- the list failed, cannot be fetched offline, or holds only
 * special editions -- it falls back to the cached feed.
 */
function TopPage({columnWidth, onShowSection}: TopPageProps): React.ReactNode {
	let {issues, query} = useMessIssues()
	let {top, special} = topOf(issues ?? [])
	if (top) {
		return (
			<IssuePage
				banner={special ? <SpecialEditionBanner issue={special} /> : undefined}
				columnWidth={columnWidth}
				issue={top}
				onShowSection={onShowSection}
				showMasthead={true}
			/>
		)
	}
	// Offline, a list never fetched is paused, not failed, and would otherwise load for ever.
	let unreachable = query.isError || query.fetchStatus === 'paused' || issues !== undefined
	if (unreachable) {
		return (
			<LatestStories
				columnWidth={columnWidth}
				onRetryIssues={() => query.refetch()}
				onShowSection={onShowSection}
			/>
		)
	}
	return (
		<>
			<Masthead />
			<PageLoading />
		</>
	)
}

type LatestStoriesProps = TopPageProps & {onRetryIssues: () => Promise<unknown>}

/** Top without an issue: the feed's stories, laid out as shelves under "Latest stories". */
function LatestStories({
	columnWidth,
	onShowSection,
	onRetryIssues,
}: LatestStoriesProps): React.ReactNode {
	let feed = useQuery(messFeedOptions)
	let body: React.ReactNode
	if (feed.data) {
		body = (
			<IssueStories columnWidth={columnWidth} onShowSection={onShowSection} stories={feed.data} />
		)
	} else if (feed.isError) {
		body = (
			<PageNotice
				error={feed.error}
				onRetry={() => Promise.all([onRetryIssues(), feed.refetch()])}
			/>
		)
	} else {
		body = <PageLoading />
	}
	return (
		<>
			<Masthead dateline={LATEST_STORIES} />
			{body}
		</>
	)
}

/** Every issue, newest first, special editions among them; tapping one opens it on a page of its own. */
function IssuesPage(): React.ReactNode {
	let router = useRouter()
	let {issues, query} = useMessIssues()
	let body: React.ReactNode
	if (issues) {
		body = (
			<IssueList
				issues={issues}
				onOpen={(issue) =>
					router.navigate({pathname: '/Messenger/issue', params: {day: issue.day}})
				}
				query={query}
			/>
		)
	} else if (query.isError) {
		body = <PageNotice error={query.error} onRetry={() => query.refetch()} />
	} else {
		body = <PageLoading />
	}
	return (
		<>
			<Masthead dateline={EVERY_ISSUE} />
			{body}
		</>
	)
}
