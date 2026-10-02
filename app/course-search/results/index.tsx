import * as React from 'react'
import {StyleSheet, SectionList, ActivityIndicator, Text} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {
	updateRecentSearches,
	updateRecentFilters,
	selectRecentFilters,
} from '../../../source/redux/parts/courses'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import type {CourseType} from '../../../source/lib/course-search'
import {useAppDispatch, useAppSelector} from '../../../source/redux'
import {Filter, FilterToolbar} from '@frogpond/filter'
import {useFilters} from '../../../source/features/sis/course-search/lib/build-filters'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useDebounce} from '@frogpond/use-debounce'
import {ListSeparator, ListSectionHeader, largeListProps} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {CourseRow} from '../../../source/features/sis/course-search/row'
import {parseTerm} from '../../../source/lib/course-search'
import {SearchBar} from '../../../source/components/search-bar'
import {
	useCourseCatalog,
	useCourseFilterOptions,
	useCourseResults,
} from '../../../source/database/courses/read'
import {courseFilters} from '../../../source/database/courses/filters'
import type {CourseListItem} from '../../../source/database/courses/rows'
import {
	COURSE_OFFLINE_NOTICE,
	courseListState,
} from '../../../source/features/sis/course-search/lib/list-state'

function CourseSearchResultsView(): React.ReactNode {
	let dispatch = useAppDispatch()
	let router = useRouter()

	let {initialQuery = '', filterDescription} = useLocalSearchParams<{
		initialQuery?: string
		filterDescription?: string
	}>()

	let {data: basicFilters, error: filterError, isLoading: filtersLoading} = useFilters()

	let recentFilters = useAppSelector(selectRecentFilters)

	let initialFilters = React.useMemo(() => {
		let selectedFilterCombo = filterDescription
			? recentFilters.find((f) => f.description === filterDescription)
			: undefined
		if (!selectedFilterCombo) {
			return []
		}
		let filterLookup = Object.fromEntries(selectedFilterCombo.filters.map((f) => [f.key, f]))
		return basicFilters.map((f) => filterLookup[f.key] || f)
		// oxlint-disable-next-line react/exhaustive-deps
	}, [filterDescription])

	let [filters, setFilters] = React.useState<Filter<CourseType>[]>(
		initialFilters.length > 0 ? initialFilters : basicFilters,
	)

	let [searchQuery, setSearchQuery] = React.useState(initialQuery)
	let delayedQuery = useDebounce(searchQuery, 500)

	let catalog = useCourseCatalog()
	let options = useCourseFilterOptions()
	let results = useCourseResults({
		query: delayedQuery ?? '',
		filters: courseFilters(filters, options.terms),
		enabled: !options.isPending,
	})
	let state = courseListState(catalog, results)
	let {retry: retryRead} = results
	let retry = React.useCallback(() => {
		void catalog.refetch()
		retryRead()
	}, [catalog, retryRead])

	let handlePress = React.useCallback(
		(data: CourseListItem) => {
			if (delayedQuery?.length) {
				// if there is text in the search bar, add the text to the Recent Searches list
				dispatch(updateRecentSearches(delayedQuery))
			} else if (filters.some((f) => f.enabled)) {
				// if there is at least one active filter, add the filter set to the Recent Filters list
				dispatch(updateRecentFilters(filters))
			}
			router.navigate({
				pathname: '/course-search/results/course',
				params: {clbid: data.clbid.toString(), term: data.term.toString()},
			})
		},
		[router, dispatch, delayedQuery, filters],
	)

	let updateFilter = React.useCallback(
		(filter: Filter<CourseType>) => {
			let edited = filters.map((f) => (f.key !== filter.key ? f : filter))
			setFilters(edited)
		},
		[filters],
	)

	if (state === 'offline') {
		return (
			<NoticeView
				action={{label: 'Try Again', onPress: retry}}
				description={COURSE_OFFLINE_NOTICE}
				systemImage="wifi.slash"
				title="Offline"
			/>
		)
	}

	if (state === 'error') {
		return (
			<LoadErrorView
				error={catalog.error ?? new Error('The course catalog could not be read.')}
				onRetry={retry}
			/>
		)
	}

	if (state === 'loading') {
		return <LoadingView text="Loading Course Data…" />
	}

	let header =
		filterError instanceof Error ? (
			<Text>There was a problem loading the filters: {filterError.message}</Text>
		) : filtersLoading ? (
			<ActivityIndicator style={styles.spinner} />
		) : (
			<FilterToolbar filters={filters} onChange={updateFilter} />
		)

	let hasActiveFilter = filters.some((f) => f.enabled)
	let message = hasActiveFilter
		? {
				title: 'No Matches',
				description: 'No courses match these filters. Try a different combination.',
			}
		: delayedQuery?.length
			? {
					title: 'No Results',
					description: 'No courses match your search. Check the spelling or try a new search.',
				}
			: {
					title: 'Search for a Course',
					description:
						"Search by professor (e.g. 'Jill Dietz'), course name (e.g. 'Abstract Algebra'), department and number (e.g. MATH 252), or GE (e.g. WRI).",
				}

	let messageView = (
		<NoticeView
			description={message.description}
			style={styles.message}
			systemImage="magnifyingglass"
			title={message.title}
		/>
	)

	return (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar
				onChangeText={setSearchQuery}
				placeholder="Search for a course"
				value={searchQuery}
			/>

			<SafeAreaView edges={['left', 'right']} style={styles.screen}>
				<SectionList
					ItemSeparatorComponent={ListSeparator}
					ListEmptyComponent={messageView}
					ListHeaderComponent={header}
					contentContainerStyle={styles.contentContainer}
					contentInsetAdjustmentBehavior="automatic"
					keyExtractor={(item: CourseListItem) => String(item.clbid)}
					keyboardDismissMode="interactive"
					renderItem={({item}) => <CourseRow course={item} onPress={handlePress} />}
					renderSectionHeader={({section: {title}}) => (
						<ListSectionHeader title={parseTerm(title)} />
					)}
					onEndReached={results.loadMore}
					sections={results.sections}
					{...largeListProps}
				/>
			</SafeAreaView>
		</>
	)
}

let styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
		backgroundColor: c.systemBackground,
	},
	message: {
		paddingVertical: 16,
	},
	spinner: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},
})

export default function CourseSearchResultsPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Course Catalog</Stack.Title>
			<CourseSearchResultsView />
		</>
	)
}
