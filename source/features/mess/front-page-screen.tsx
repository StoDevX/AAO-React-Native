import * as React from 'react'
import {useWindowDimensions} from 'react-native'
import {useRouter} from 'expo-router'
import {Picker, Text, VStack} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, padding, pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'
import {useQuery, useQueryClient, type InfiniteData} from '@tanstack/react-query'
import {firstPagesOf} from '../../lib/infinite-data'
import {NewsPicker} from '../news/news-picker'
import {OLAF_MESSENGER} from '../news/sources'
import {useNewsFilterStore} from '../news/store'
import {IssueGrid} from './issue-grid'
import {LatestPage} from './latest-page'
import {viewKey, viewOf, type MessView} from './lib/front-view'
import {messKeys} from './lib/keys'
import {MAIN_SECTIONS} from './lib/posts'
import {PaperNameTitle} from './masthead'
import {MessPage, PAGE_MARGIN} from './mess-page'
import {PageLoading, PageMessage, PageNotice} from './page-notice'
import {messFeedOptions} from './query'
import {StoryRows} from './story-list'
import type {LightPost, MessIssue} from './types'
import {useMessIssues} from './use-mess-issues'

/** Names the By Issue / Latest switch, for a UI test. */
export const MODE_SWITCH_ID = 'mess-mode-switch'

const SWITCH = [
	pickerStyle('segmented'),
	padding({horizontal: PAGE_MARGIN, vertical: 8}),
	accessibilityIdentifier(MODE_SWITCH_ID),
]

type Mode = MessView['mode']

/** By Issue or Latest, pinned under the navigation bar. */
function ModeSwitch({
	mode,
	onChoose,
}: {
	mode: Mode
	onChoose: (mode: Mode) => void
}): React.ReactNode {
	return (
		<VStack>
			<Picker<Mode> modifiers={SWITCH} onSelectionChange={onChoose} selection={mode}>
				<Text modifiers={[tag('issues')]}>By Issue</Text>
				<Text modifiers={[tag('latest')]}>Latest</Text>
			</Picker>
		</VStack>
	)
}

/** Every issue as a grid, the newest on top. */
function ByIssuePage(): React.ReactNode {
	let router = useRouter()
	let {width, height} = useWindowDimensions()
	let {issues, query} = useMessIssues()
	// Kept the same across renders, so the grid's memoized tiles are not all drawn again.
	let open = React.useCallback(
		(issue: MessIssue) => router.navigate({pathname: '/Messenger/issue', params: {key: issue.key}}),
		[router],
	)
	if (issues && issues.length > 0) {
		return <IssueGrid issues={issues} landscape={width > height} onOpen={open} query={query} />
	}
	if (issues) return <PageMessage text="The Mess has no issues yet." />
	if (query.isError) {
		return (
			<>
				<PageNotice error={query.error} onRetry={() => query.refetch()} />
				<SavedLatestStories />
			</>
		)
	}
	let paused = query.fetchStatus === 'paused'
	return (
		<>
			<PageLoading paused={paused} />
			{paused ? <SavedLatestStories /> : null}
		</>
	)
}

/**
 * Latest's stories as saved from an earlier visit, under By Issue's notice when its issue list
 * cannot load, so an offline reader still has something to read. Nothing is fetched for them.
 */
function SavedLatestStories(): React.ReactNode {
	let feed = useQuery({...messFeedOptions, enabled: false})
	return feed.data ? <StoryRows stories={feed.data} /> : null
}

/**
 * The Mess's front page: the By Issue / Latest switch pinned under the navigation bar, then that
 * view's page; in Latest, a filter in the bottom toolbar narrows it to one section. The view and
 * the section are remembered in the news filter store.
 */
export function FrontPageScreen(): React.ReactNode {
	let queryClient = useQueryClient()
	let saved = useNewsFilterStore((state) => state.selectedCategories[OLAF_MESSENGER.id] ?? null)
	let select = useNewsFilterStore((state) => state.select)
	let view = viewOf(saved)
	let choose = (next: MessView) => select(OLAF_MESSENGER.id, viewKey(next))

	return (
		<>
			<PaperNameTitle />
			{view.mode === 'latest' ? (
				<NewsPicker
					categories={MAIN_SECTIONS}
					onSelect={(section) => choose({mode: 'latest', section})}
					selectedCategory={view.section}
				/>
			) : null}
			<MessPage
				// Only the view showing has queries mounted, so refetching the active Mess queries
				// refreshes that view alone. The issue list is cut to its first page first, since an
				// infinite query refetches every page it holds, one after another.
				onRefresh={() => {
					queryClient.setQueryData<InfiniteData<LightPost[]>>(messKeys.issues, (data) =>
						data ? firstPagesOf(data, 1) : data,
					)
					return queryClient.refetchQueries({queryKey: messKeys.all, type: 'active'})
				}}
				pinned={<ModeSwitch mode={view.mode} onChoose={(mode) => choose({...view, mode})} />}
			>
				{view.mode === 'issues' ? <ByIssuePage /> : <LatestPage section={view.section} />}
			</MessPage>
		</>
	)
}
