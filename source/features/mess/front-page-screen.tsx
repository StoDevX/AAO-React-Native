import * as React from 'react'
import {useWindowDimensions} from 'react-native'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {Host, Image} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	font,
	foregroundStyle,
} from '@expo/ui/swift-ui/modifiers'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {NAVIGATION_TITLE_ID, TITLE_HOST_STYLE} from '../../components/navigation-title'
import {refetchFromFirstPage} from '../../lib/infinite-data'
import {useNewsFilterStore} from '../news/store'
import {IssueGrid} from './issue-grid'
import {LatestPage} from './latest-page'
import {linkedView, viewKey, viewOf, type MessView} from './lib/front-view'
import {paperKeys} from './lib/keys'
import {MessPage, PAPER_BAR, PaperTitle} from './mess-page'
import {usePaper} from './paper-context'
import type {PaperRoutes} from './paper'
import {PageLoading, PageMessage, PageNotice} from './page-notice'
import {CUSTOMIZE_LABEL} from '../customize/labels'
import {StoryRows} from './story-list'
import type {MessIssue} from './types'
import {useMessIssues} from './use-mess-issues'
import {usePaperQueries} from './use-paper-queries'

/** The name each view goes by in the menu, and in the menu button's label. */
const VIEW_NAMES = {issues: 'By Issue', latest: 'Latest'} as const

/** The Messenger's castle, alone in the title, read by VoiceOver as the paper's name. */
function castle(title: string) {
	return [
		font({textStyle: 'title2'}),
		foregroundStyle(c.label),
		accessibilityLabel(title),
		accessibilityAddTraits(['isHeader']),
		accessibilityIdentifier(NAVIGATION_TITLE_ID),
	]
}

/** The paper's pages the view menu leads to, beside its views. */
type MessPagePath = PaperRoutes['about'] | PaperRoutes['staff']

/**
 * The glass buttons at the top right: the paintbrush, which opens the paper's Customize
 * sheet, and a menu to pick By Issue or Latest and, in Latest, the section to narrow it to, then
 * ways to the paper's Contact and Staff pages. The menu reads as More, as a ⋯ button does, then
 * the view showing, since the icon alone does not say it. Both sit at the right because a button
 * at the left would replace the Back button.
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
	let {mainSections, routes} = usePaper()
	return (
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.Button
				accessibilityLabel={CUSTOMIZE_LABEL}
				icon="paintbrush"
				onPress={onCustomize}
			/>
			<Stack.Toolbar.Menu accessibilityLabel={`More, ${VIEW_NAMES[view.mode]}`} icon="ellipsis">
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
						{mainSections.map((section) => (
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
					<Stack.Toolbar.MenuAction onPress={() => onOpen(routes.about)}>
						Contact
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction onPress={() => onOpen(routes.staff)}>
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
	let paper = usePaper()
	let {width, height} = useWindowDimensions()
	let {issues, query} = useMessIssues()
	// Kept the same across renders, so the grid's memoized tiles are not all drawn again.
	let open = React.useCallback(
		(issue: MessIssue) => router.navigate({pathname: paper.routes.issue, params: {key: issue.key}}),
		[paper, router],
	)
	if (issues && issues.length > 0) {
		return <IssueGrid issues={issues} landscape={width > height} onOpen={open} query={query} />
	}
	if (issues) return <PageMessage text={`${paper.shortTitle} has no issues yet.`} />
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
	let feed = useInfiniteQuery({...usePaperQueries().feedOptions, enabled: false})
	return feed.data ? <StoryRows stories={feed.data.pages.flat()} /> : null
}

/**
 * A paper's front page: a navigation bar on the paper, titled with its masthead (the Messenger's
 * castle, or the paper's name), with the paintbrush and the view menu at its right, over the
 * view's page. The view and the section are remembered in the news filter store, under the
 * paper's id. A link can name the view to open on, and the section to narrow Latest to:
 * `/messenger?view=Latest&section=Variety`.
 */
export function FrontPageScreen(): React.ReactNode {
	let router = useRouter()
	let paper = usePaper()
	let queryClient = useQueryClient()
	let saved = useNewsFilterStore((state) => state.selectedCategories[paper.id] ?? null)
	let select = useNewsFilterStore((state) => state.select)
	let view = viewOf(saved, paper.mainSections)
	let choose = (next: MessView) => select(paper.id, viewKey(next))

	let link = useLocalSearchParams<{view?: string; section?: string}>()
	React.useEffect(() => {
		let linked = linkedView(link.view, link.section, paper.mainSections)
		if (linked) {
			select(paper.id, viewKey(linked))
		}
	}, [link.view, link.section, paper, select])

	return (
		<>
			<Stack.Screen options={PAPER_BAR} />
			{paper.masthead ? (
				<>
					{/* `Stack.Title asChild` sets only `headerTitle`; the plain title is what the Back
					    button reads. An explicit size, as a navigation bar gives its title view none. */}
					<Stack.Screen options={{title: paper.title}} />
					<Stack.Title asChild={true}>
						<Host style={TITLE_HOST_STYLE}>
							<Image assetName={paper.masthead.assetName} modifiers={castle(paper.title)} />
						</Host>
					</Stack.Title>
				</>
			) : (
				// A paper with no drawn masthead has its name set in the paper's type.
				<PaperTitle title={paper.title} />
			)}
			<ViewMenu
				onChoose={choose}
				onCustomize={() => router.navigate(paper.routes.customize)}
				onOpen={(path) => router.navigate(path)}
				view={view}
			/>
			<MessPage
				// Only the view showing has queries mounted, so refetching the active Mess queries
				// refreshes that view alone.
				onRefresh={() => refetchFromFirstPage(queryClient, paperKeys(paper.id).all)}
			>
				{view.mode === 'issues' ? <ByIssuePage /> : <LatestPage section={view.section} />}
			</MessPage>
		</>
	)
}
