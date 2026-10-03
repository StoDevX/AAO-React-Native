import * as React from 'react'
import {useWindowDimensions} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'
import {refetchFromFirstPage} from '../../lib/infinite-data'
import {OLAF_MESSENGER} from '../news/sources'
import {useNewsFilterStore} from '../news/store'
import {IssueGrid} from './issue-grid'
import {LatestPage} from './latest-page'
import {viewKey, viewOf, type MessView} from './lib/front-view'
import {messKeys} from './lib/keys'
import {MAIN_SECTIONS} from './lib/posts'
import {Masthead} from './masthead'
import {MessPage} from './mess-page'
import {PageLoading, PageMessage, PageNotice} from './page-notice'
import {messFeedOptions} from './query'
import {CUSTOMIZE_LABEL} from '../customize/labels'
import {StoryRows} from './story-list'
import type {MessIssue} from './types'
import {useMessIssues} from './use-mess-issues'

/** The name each view goes by in the menu, and in the menu button's label. */
const VIEW_NAMES = {issues: 'By Issue', latest: 'Latest'} as const

/** Latest's dateline, naming what it lists; By Issue's tiles carry their own dates, so it has none. */
function datelineOf(view: MessView): string | null {
	if (view.mode === 'issues') return null
	return view.section ?? 'Latest stories'
}

/** The paper's pages the view menu leads to, beside its views. */
type MessPagePath = '/messenger/about' | '/messenger/staff'

/**
 * The glass buttons at the top right: the paintbrush, which opens the Messenger's Customize
 * sheet, and a menu to pick By Issue or Latest and, in Latest, the section to narrow it to, then
 * ways to the paper's About and Staff pages. The menu's label names the view showing, since the
 * icon alone does not. Both sit at the right because a button at the left would replace the Back
 * button.
 */
function ViewMenu({
	view,
	onChoose,
	onCustomize,
	onOpen,
}: {
	view: MessView
	onChoose: (view: MessView) => void
	onCustomize: () => void
	onOpen: (path: MessPagePath) => void
}): React.ReactNode {
	return (
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.Button
				accessibilityLabel={CUSTOMIZE_LABEL}
				icon="paintbrush"
				onPress={onCustomize}
			/>
			<Stack.Toolbar.Menu accessibilityLabel={`View: ${VIEW_NAMES[view.mode]}`} icon="ellipsis">
				<Stack.Toolbar.Menu inline={true} title="View">
					<Stack.Toolbar.MenuAction
						isOn={view.mode === 'issues'}
						onPress={() => onChoose({...view, mode: 'issues'})}
					>
						{VIEW_NAMES.issues}
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction
						isOn={view.mode === 'latest'}
						onPress={() => onChoose({...view, mode: 'latest'})}
					>
						{VIEW_NAMES.latest}
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
				{view.mode === 'latest' ? (
					<Stack.Toolbar.Menu inline={true} title="Section">
						<Stack.Toolbar.MenuAction
							isOn={view.section === null}
							onPress={() => onChoose({mode: 'latest', section: null})}
						>
							All Stories
						</Stack.Toolbar.MenuAction>
						{MAIN_SECTIONS.map((section) => (
							<Stack.Toolbar.MenuAction
								key={section}
								isOn={view.section === section}
								onPress={() => onChoose({mode: 'latest', section})}
							>
								{section}
							</Stack.Toolbar.MenuAction>
						))}
					</Stack.Toolbar.Menu>
				) : null}
				{/* Their own inline group, so the menu draws a divider between the views and them */}
				<Stack.Toolbar.Menu inline={true}>
					<Stack.Toolbar.MenuAction onPress={() => onOpen('/messenger/about')}>
						About
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction onPress={() => onOpen('/messenger/staff')}>
						Staff
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar.Menu>
		</Stack.Toolbar>
	)
}

/** Every issue as a grid, the newest on top. */
function ByIssuePage(): React.ReactNode {
	let router = useRouter()
	let {width, height} = useWindowDimensions()
	let {issues, query} = useMessIssues()
	// Kept the same across renders, so the grid's memoized tiles are not all drawn again.
	let open = React.useCallback(
		(issue: MessIssue) => router.navigate({pathname: '/messenger/issue', params: {key: issue.key}}),
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
	let feed = useInfiniteQuery({...messFeedOptions, enabled: false})
	return feed.data ? <StoryRows stories={feed.data.pages.flat()} /> : null
}

/**
 * The Mess's front page: a clear navigation bar with the view menu at its right, over the paper's
 * masthead and then the view's page. The bar keeps no title, so the masthead names the paper; the
 * screen's title is still what the Back button reads. The view and the section are remembered in
 * the news filter store.
 */
export function FrontPageScreen(): React.ReactNode {
	let router = useRouter()
	let queryClient = useQueryClient()
	let saved = useNewsFilterStore((state) => state.selectedCategories[OLAF_MESSENGER.id] ?? null)
	let select = useNewsFilterStore((state) => state.select)
	let view = viewOf(saved)
	let choose = (next: MessView) => select(OLAF_MESSENGER.id, viewKey(next))

	return (
		<>
			<Stack.Screen
				options={{title: OLAF_MESSENGER.title, headerTitle: '', headerTransparent: true}}
			/>
			<ViewMenu
				onChoose={choose}
				onCustomize={() => router.navigate('/messenger/customize')}
				onOpen={(path) => router.navigate(path)}
				view={view}
			/>
			<MessPage
				// Only the view showing has queries mounted, so refetching the active Mess queries
				// refreshes that view alone.
				onRefresh={() => refetchFromFirstPage(queryClient, messKeys.all)}
			>
				{/* By Issue's tiles each print the paper's name, so its masthead is the castle */}
				<Masthead castle={view.mode === 'issues'} dateline={datelineOf(view)} />
				{view.mode === 'issues' ? <ByIssuePage /> : <LatestPage section={view.section} />}
			</MessPage>
		</>
	)
}
