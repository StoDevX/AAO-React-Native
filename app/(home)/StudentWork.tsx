import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, RNHostView, Section, VStack} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, id, listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {FilterToolbar} from '@frogpond/filter'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {jobPostingsOptions, type JobSummary} from '@frogpond/ccc-jobs'
import {useDebounce} from '@frogpond/use-debounce'
import {Stack, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {DisclosureRow} from '../../source/components/rows'
import {SearchBar} from '../../source/components/search-bar'
import {
	buildJobFilters,
	visibleSections,
	type ChosenJobFilters,
} from '../../source/features/sis/student-work/filters'
import {jobRowDetail, listState} from '../../source/features/sis/student-work/lib'
import {displayTitle} from '../../source/features/sis/student-work/posting'

/// Mirrored by TestIdentifiers.StudentWork.postingsList.
const POSTINGS_LIST_ID = 'student-work-postings'

const NOTHING_CHOSEN: ChosenJobFilters = {level: null, term: null}

/// One posting's row, memoized so a keystroke in the search field -- which
/// re-renders the screen before the debounced search changes anything --
/// does not rebuild every row.
const JobRow = React.memo(function JobRow({
	job,
	onOpen,
}: {
	job: JobSummary
	onOpen: (jobId: string) => void
}): React.ReactNode {
	return (
		<DisclosureRow
			detail={jobRowDetail(job)}
			onPress={() => onOpen(job.id)}
			title={displayTitle(job.title)}
			titleLines={2}
		/>
	)
})

export default function StudentWorkPage(): React.ReactNode {
	let router = useRouter()
	let {data = [], error, isError, refetch, isLoading} = useQuery(jobPostingsOptions)

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query, 200)

	// Only the narrowing the student asked for is state; the options on offer
	// come from the postings, so a refetch can add or drop them.
	let [chosen, setChosen] = React.useState<ChosenJobFilters>(NOTHING_CHOSEN)

	let allJobs = React.useMemo(() => data.flatMap((category) => category.jobs), [data])
	let filters = React.useMemo(() => buildJobFilters(allJobs, chosen), [allJobs, chosen])
	let sections = React.useMemo(
		() => visibleSections(data, filters, searchQuery),
		[data, filters, searchQuery],
	)

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

	let state = listState({isError, isLoading, hasPostings: allJobs.length > 0})

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

	if (state === 'error') {
		let message = error instanceof Error ? error.message : String(error)
		return (
			<>
				{chrome}
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
				{chrome}
				<LoadingView />
			</>
		)
	}

	return (
		<>
			{chrome}
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
									setChosen((previous) => ({...previous, [changed.apply.key]: titles}))
								}}
							/>
						</RNHostView>
					) : null}
					<List
						modifiers={[
							listStyle('insetGrouped'),
							refreshable(async () => {
								await refetch()
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
										<JobRow key={job.id} job={job} onOpen={openJob} />
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
