import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, RNHostView, Section, VStack} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, id, listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {FilterToolbar} from '@frogpond/filter'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {keys, type JobSummary} from '@frogpond/ccc-jobs'
import {useRouter} from 'expo-router'
import {useQueryClient} from '@tanstack/react-query'
import {DisclosureRow, type DisclosureRowImage} from '../../../components/rows'
import {chosenAreaState} from './areas'
import {buildJobFilters, choosePosted, visibleSections, type ChosenJobFilters} from './filters'
import {jobRowDetail, listState} from './lib'
import {displayTitle} from './posting'
import {useStudentWorkBoard} from './use-board'

/// Mirrored by TestIdentifiers.StudentWork.postingsList.
const POSTINGS_LIST_ID = 'student-work-postings'

/// No filter chosen: the whole board.
export const NOTHING_CHOSEN: ChosenJobFilters = {area: null, posted: null, level: null, term: null}

const DOT_SIZE = 10

/// Mail's unread dot. Rows that are not new draw the same dot in clear, so
/// every title starts at the same place.
const NEW_DOT: DisclosureRowImage = {
	systemName: 'circle.fill',
	tint: c.systemBlue,
	size: DOT_SIZE,
	label: 'New',
}
const NO_DOT: DisclosureRowImage = {systemName: 'circle.fill', tint: c.clear, size: DOT_SIZE}

/// One posting's row, memoized so a keystroke in the search field -- which
/// re-renders the screen before the debounced search changes anything --
/// does not rebuild every row.
const JobRow = React.memo(function JobRow({
	job,
	isNew,
	onOpen,
}: {
	job: JobSummary
	isNew: boolean
	onOpen: (jobId: string) => void
}): React.ReactNode {
	return (
		<DisclosureRow
			detail={jobRowDetail(job)}
			image={isNew ? NEW_DOT : NO_DOT}
			onPress={() => onOpen(job.id)}
			title={displayTitle(job.title)}
			titleLines={2}
		/>
	)
})

type PostingsListProps = {
	/// The search the screen around the list owns.
	searchQuery: string
	/// The filters the list opens with; the student can change them all.
	initialChosen: ChosenJobFilters
}

/// Student Work's postings: recency sections, New dots, and a filter bar,
/// shared by the landing screen's search and the postings screen.
export function PostingsList({searchQuery, initialChosen}: PostingsListProps): React.ReactNode {
	let router = useRouter()
	let queryClient = useQueryClient()
	let {board, jobs, context, refresh} = useStudentWorkBoard()
	let {data = [], error, isError, refetch, isLoading} = board

	// Only the narrowing the student asked for is state; the options on offer
	// come from the postings, so a refetch can add or drop them.
	let [chosen, setChosen] = React.useState<ChosenJobFilters>(initialChosen)

	let filters = React.useMemo(() => buildJobFilters(jobs, chosen, context), [jobs, chosen, context])
	let sections = React.useMemo(
		() => visibleSections(data, filters, searchQuery, context),
		[data, filters, searchQuery, context],
	)
	let {newIds} = context

	let isNarrowed = searchQuery !== '' || filters.some((filter) => filter.enabled)

	// Keyed on what the list shows, so a search or filter that changes nothing
	// on screen leaves the student where they were.
	let shownIds = React.useMemo(
		() => sections.flatMap((section) => section.data.map((job) => job.id)).join(','),
		[sections],
	)

	let openJob = React.useCallback(
		(jobId: string) => router.navigate({pathname: '/JobDetail', params: {jobId}}),
		[router],
	)

	let state = listState({isError, isLoading, hasPostings: jobs.length > 0})

	if (state === 'error') {
		let message = error instanceof Error ? error.message : String(error)
		return (
			<>
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occurred while loading: ${message}`}
				/>
			</>
		)
	}

	if (state === 'loading') {
		return (
			<>
				<LoadingView />
			</>
		)
	}

	let areaState = chosenAreaState(chosen.area, context.areas, context.membership)

	if (areaState === 'loading') {
		return <LoadingView />
	}

	if (areaState === 'failed') {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={() => queryClient.refetchQueries({queryKey: keys.units})}
				text="A problem occurred while loading this area’s postings."
			/>
		)
	}

	return (
		<>
			<Host style={styles.host}>
				{/* The toolbar is React Native, bridged into the SwiftUI stack so it
				    sits under the navigation bar rather than behind it. */}
				<VStack spacing={0}>
					{/* An empty board offers no filters, and an empty bar says nothing. */}
					{filters.length > 0 ? (
						<RNHostView matchContents={true}>
							<FilterToolbar
								filters={filters}
								onChange={(changed) => {
									if (changed.type !== 'list') return
									let titles = changed.spec.selected.map((option) => option.title)
									setChosen((previous) =>
										changed.apply.key === 'posted'
											? {...previous, posted: choosePosted(previous.posted, titles)}
											: {...previous, [changed.apply.key]: titles},
									)
								}}
							/>
						</RNHostView>
					) : null}
					<List
						modifiers={[
							listStyle('insetGrouped'),
							refreshable(async () => {
								await refresh()
							}),
							accessibilityIdentifier(POSTINGS_LIST_ID),
							// A new set of postings is a new list, starting from the top.
							// Without this the list keeps the offset it had, and postings
							// that sort above it land offscreen.
							id(shownIds),
						]}
					>
						{sections.length === 0 ? (
							<ContentUnavailableView
								description={isNarrowed ? 'Try a different search or filter.' : undefined}
								systemImage="briefcase"
								title={isNarrowed ? 'No matching jobs.' : 'There are no open job postings.'}
							/>
						) : (
							sections.map((section) => (
								<Section key={section.title} title={section.title}>
									{section.data.map((job) => (
										<JobRow key={job.id} isNew={newIds.has(job.id)} job={job} onOpen={openJob} />
									))}
								</Section>
							))
						)}
					</List>
				</VStack>
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
