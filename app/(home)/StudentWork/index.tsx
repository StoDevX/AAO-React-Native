import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'
import {Stack, useRouter} from 'expo-router'
import {DisclosureRow} from '../../../source/components/rows'
import {SearchBar} from '../../../source/components/search-bar'
import {AreaGrid} from '../../../source/features/sis/student-work/area-grid'
import {listState} from '../../../source/features/sis/student-work/lib'
import {NOTHING_CHOSEN, PostingsList} from '../../../source/features/sis/student-work/postings-list'
import {PRESETS, presetCounts} from '../../../source/features/sis/student-work/presets'
import {useSeenPostingsStore} from '../../../source/features/sis/student-work/store'
import {useStudentWorkBoard} from '../../../source/features/sis/student-work/use-board'

/// Student Work's landing: area tiles, then presets, each opening the
/// postings list with its filters prefilled. Typing a search swaps the
/// landing for the whole board's matching postings.
export default function StudentWorkPage(): React.ReactNode {
	let router = useRouter()
	let {board, jobs, areas, context} = useStudentWorkBoard()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query, 200)

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
		isError: board.isError,
		isLoading: board.isLoading,
		hasPostings: jobs.length > 0,
	})

	if (state === 'error') {
		let message = board.error instanceof Error ? board.error.message : String(board.error)
		return (
			<>
				{chrome}
				<NoticeView
					buttonText="Try Again"
					onPress={board.refetch}
					text={`A problem occurred while loading: ${message}`}
				/>
			</>
		)
	}

	if (state === 'loading' || !areas) {
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
							await board.refetch()
						}),
					]}
				>
					<AreaGrid
						areas={areas}
						membership={context.membership}
						onSelectArea={(area) =>
							router.navigate({pathname: '/StudentWork/postings', params: {area: area.slug}})
						}
					/>

					<Section>
						{PRESETS.map((preset) => (
							<DisclosureRow
								key={preset.key}
								badge={counts[preset.key]}
								disabled={counts[preset.key] === 0}
								onPress={() =>
									router.navigate({pathname: '/StudentWork/postings', params: preset.params})
								}
								title={preset.title}
							/>
						))}
					</Section>
				</List>
			</Host>
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
