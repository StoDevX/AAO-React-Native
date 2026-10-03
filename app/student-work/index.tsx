import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {listState, LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'
import {onlineManager} from '@tanstack/react-query'
import {Stack, useRouter} from 'expo-router'
import {LayoutMenu} from '../../source/components/layout-menu'
import {DisclosureRow} from '../../source/components/rows'
import {SearchBar} from '../../source/components/search-bar'
import {AreaSection} from '../../source/features/sis/student-work/area-section'
import {NOTHING_CHOSEN, PostingsList} from '../../source/features/sis/student-work/postings-list'
import {PRESETS, presetCounts} from '../../source/features/sis/student-work/presets'
import {
	useAreaLayoutStore,
	useSeenPostingsStore,
} from '../../source/features/sis/student-work/store'
import {useStudentWorkBoard} from '../../source/features/sis/student-work/use-board'

/// Offline, with no board saved to show.
const OFFLINE_NOTICE = 'Student Work needs a connection to load the job board the first time.'

/// Student Work's landing: area tiles, then presets, each opening the
/// postings list with its filters prefilled. Typing a search swaps the
/// landing for the whole board's matching postings.
export default function StudentWorkPage(): React.ReactNode {
	let router = useRouter()
	let {board, jobs, areas, context, refresh} = useStudentWorkBoard({checkForNewPostings: true})

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query, 200)

	let layout = useAreaLayoutStore((state) => state.layout)
	let setLayout = useAreaLayoutStore((state) => state.setLayout)

	// Remembered on leaving Student Work for the home screen, not on leaving a
	// list: the landing stays mounted under everything Student Work pushes, so
	// the dots stay put while the student browses.
	let markSeen = useSeenPostingsStore((state) => state.markSeen)
	let latestIds = React.useRef<string[]>([])
	React.useEffect(() => {
		latestIds.current = jobs.map((job) => job.id)
	}, [jobs])
	React.useEffect(() => () => markSeen(latestIds.current), [markSeen])

	let counts = React.useMemo(
		() => presetCounts(jobs, context.newIds, context.today),
		[jobs, context.newIds, context.today],
	)

	// The search chrome is bound to component state, so it is rendered in
	// every branch: the student always has a field to type into or clear.
	let chrome = (
		<>
			<Stack.Title>Student Work</Stack.Title>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>
			<SearchBar onChangeText={setQuery} value={query} />
			{/* Search results are always rows, so the menu goes while they show. */}
			{searchQuery === '' ? <LayoutMenu layout={layout} onChange={setLayout} /> : null}
		</>
	)

	if (searchQuery !== '') {
		return (
			<>
				{chrome}
				<PostingsList initialChosen={NOTHING_CHOSEN} searchQuery={searchQuery} />
			</>
		)
	}

	let state = listState({
		hasData: jobs.length > 0,
		isError: board.isError,
		isPending: board.isPending,
		isPaused: board.isPaused,
		isOnline: onlineManager.isOnline(),
	})

	if (state === 'offline') {
		return (
			<>
				{chrome}
				<NoticeView
					action={{label: 'Try Again', onPress: board.refetch}}
					description={OFFLINE_NOTICE}
					systemImage="wifi.slash"
					title="Offline"
				/>
			</>
		)
	}

	if (state === 'error') {
		return (
			<>
				{chrome}
				<LoadErrorView error={board.error} onRetry={board.refetch} />
			</>
		)
	}

	if (state === 'loading') {
		return (
			<>
				{chrome}
				<LoadingView />
			</>
		)
	}

	return (
		<>
			{chrome}
			<Host matchContents={false} style={styles.host}>
				<List
					modifiers={[
						listStyle('insetGrouped'),
						refreshable(async () => {
							await refresh()
						}),
					]}
				>
					<AreaSection
						areas={areas}
						layout={layout}
						membership={context.membership}
						onSelectArea={(area) =>
							router.navigate({pathname: '/student-work/postings', params: {area: area.slug}})
						}
					/>

					<Section>
						{PRESETS.map((preset) => (
							<DisclosureRow
								key={preset.key}
								badge={counts[preset.key]}
								onPress={() =>
									router.navigate({pathname: '/student-work/postings', params: preset.params})
								}
								title={preset.title}
								titleLines={PRESET_TITLE_LINES}
							/>
						))}
					</Section>
				</List>
			</Host>
		</>
	)
}

/// Enough that no preset's title is cut off at any text size: the longest,
/// "New since your last visit", wraps to three lines at AX5 on a 390pt-wide
/// phone, so four leaves room for a narrower one.
const PRESET_TITLE_LINES = 4

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
