import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {FilterToolbar} from '@frogpond/filter'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {jobPostingsOptions} from '@frogpond/ccc-jobs'
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
import {jobRowDetail} from '../../source/features/sis/student-work/lib'
import {displayTitle} from '../../source/features/sis/student-work/posting'

const NOTHING_CHOSEN: ChosenJobFilters = {level: null, term: null}

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

	if (isError) {
		return (
			<>
				{chrome}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${error}`}
				/>
			</>
		)
	}

	if (isLoading) {
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
			<FilterToolbar
				filters={filters}
				onChange={(changed) => {
					if (changed.type !== 'list') return
					let titles = changed.spec.selected.map((option) => option.title)
					setChosen((previous) => ({...previous, [changed.apply.key]: titles}))
				}}
			/>
			<Host style={styles.host}>
				<List
					modifiers={[
						listStyle('insetGrouped'),
						refreshable(async () => {
							await refetch()
						}),
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
									<DisclosureRow
										key={job.id}
										detail={jobRowDetail(job)}
										onPress={() =>
											router.navigate({pathname: '/JobDetail', params: {jobId: job.id}})
										}
										title={displayTitle(job.title)}
										titleLines={2}
									/>
								))}
							</Section>
						))
					)}
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
