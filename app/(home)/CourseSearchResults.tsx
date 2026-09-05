import * as React from 'react'
import {StyleSheet, SectionList, ActivityIndicator, Text} from 'react-native'
import {
	updateRecentSearches,
	updateRecentFilters,
	selectRecentFilters,
} from '../../source/redux/parts/courses'
import {LoadingView, NoticeView} from '@frogpond/notice'
import type {CourseType} from '../../source/lib/course-search'
import {useAppDispatch, useAppSelector} from '../../source/redux'
import {applyFiltersToItem, FilterType, FilterToolbar} from '@frogpond/filter'
import {useFilters} from '../../source/features/sis/course-search/lib/build-filters'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {fromPairs} from 'lodash'
import {useDebounce} from '@frogpond/use-debounce'
import {ListSeparator, ListSectionHeader, largeListProps} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {CourseRow} from '../../source/features/sis/course-search/row'
import memoize from 'lodash/memoize'
import {parseTerm} from '../../source/lib/course-search'
import {ListSpecType} from '@frogpond/filter/types'
import {
	applySearch,
	sortAndGroupResults,
} from '../../source/features/sis/course-search/lib/execute-search'
import {useCourseData} from '../../source/features/sis/course-search/query'
import {UseQueryResult} from '@tanstack/react-query'
import {SearchBar} from '../../source/components/search-bar'

function doSearch(args: {
	query: string
	filters: Array<FilterType<CourseType>>
	courses: Array<CourseType>
	applyFilters: (filters: FilterType<CourseType>[], item: CourseType) => boolean
}) {
	let {query, filters, courses, applyFilters} = args

	let results = courses.filter((course) => applyFilters(filters, course))
	if (query) {
		results = results.filter((course) => applySearch(query, course))
	}

	return sortAndGroupResults(results)
}

let memoizedDoSearch = memoize(doSearch)

// lodash supports this; the types do not.
memoizedDoSearch.cache = new WeakMap()

function isError(e: unknown): e is Error {
	return e instanceof Error
}

function queriesToCourses(queries: UseQueryResult<CourseType[]>[]): CourseType[] {
	return queries.flatMap((q) => q.data).filter((data) => data !== undefined)
}

const useSelectedFilter = (filterKey: string, filters: FilterType<CourseType>[]) => {
	return React.useMemo(() => filters.find((f) => f.key === filterKey), [filterKey, filters])
}

const useSelectedTerm = (filters: FilterType<CourseType>[]) => {
	let termFilter = useSelectedFilter('term', filters)

	if (termFilter?.enabled) {
		let termFilterSpec = termFilter.spec as ListSpecType
		return termFilterSpec.selected.map((spec) => Number(spec.title))
	}

	return []
}

const useSelectedLevel = (filters: FilterType<CourseType>[]) => {
	let levelFilter = useSelectedFilter('level', filters)

	if (levelFilter?.enabled) {
		let levelFilterSpec = levelFilter.spec as ListSpecType
		return levelFilterSpec.selected.map((spec) => Number(spec.title))
	}

	return []
}

const useSelectedGE = (filters: FilterType<CourseType>[]) => {
	let geFilter = useSelectedFilter('gereqs', filters)

	if (geFilter?.enabled) {
		let geFilterSpec = geFilter.spec as ListSpecType
		return geFilterSpec.selected.map((spec) => spec.title)
	}

	return []
}

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
		let filterLookup = fromPairs(selectedFilterCombo.filters.map((f) => [f.key, f]))
		return basicFilters.map((f) => filterLookup[f.key] || f)
		// oxlint-disable-next-line react/exhaustive-deps
	}, [filterDescription])

	let [filters, setFilters] = React.useState<FilterType<CourseType>[]>(
		initialFilters.length ? initialFilters : basicFilters,
	)

	let [searchQuery, setSearchQuery] = React.useState(initialQuery)
	let delayedQuery = useDebounce(searchQuery, 500)

	let selectedTerms = useSelectedTerm(filters)
	let selectedLevels = useSelectedLevel(filters)
	let selectedGEs = useSelectedGE(filters)

	let allCoursesByTerm = useCourseData(selectedTerms, selectedLevels, selectedGEs)
	let areCoursesLoading = allCoursesByTerm.some((r) => r.isLoading)
	let areCoursesInError = allCoursesByTerm.some((r) => r.isError)

	let handlePress = React.useCallback(
		(data: CourseType) => {
			if (delayedQuery?.length) {
				// if there is text in the search bar, add the text to the Recent Searches list
				dispatch(updateRecentSearches(delayedQuery))
			} else if (filters.some((f) => f.enabled)) {
				// if there is at least one active filter, add the filter set to the Recent Filters list
				dispatch(updateRecentFilters(filters))
			}
			router.push({
				pathname: '/CourseDetail',
				params: {clbid: data.clbid.toString(), term: data.term.toString()},
			})
		},
		[router, dispatch, delayedQuery, filters],
	)

	let updateFilter = React.useCallback(
		(filter: FilterType<CourseType>) => {
			let edited = filters.map((f) => (f.key !== filter.key ? f : filter))
			setFilters(edited)
		},
		[filters],
	)

	if (areCoursesInError) {
		let courseTermsInError = allCoursesByTerm.filter((r) => r.isError)
		let errors = courseTermsInError
			.map((r) => r.error)
			.filter(isError)
			.map((e) => e.message)
			.join('\n')

		return (
			<NoticeView
				buttonText="Try Again"
				onPress={() => {
					for (let r of courseTermsInError) {
						r.refetch()
					}
				}}
				text={
					(courseTermsInError.length === 1 ? 'A problem' : 'Some problems') +
					` occured while loading: ${errors}`
				}
			/>
		)
	}

	if (areCoursesLoading) {
		return <LoadingView text="Loading Course Data…" />
	}

	let allCourses = queriesToCourses(allCoursesByTerm)

	// be sure to lowercase the query before calling doSearch, so that the memoization
	// doesn't break when nothing's changed except case.
	let query = delayedQuery?.toLowerCase()
	let results = memoizedDoSearch({
		query,
		filters,
		courses: allCourses,
		applyFilters: applyFiltersToItem,
	})

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
		? 'There were no courses that matched your selected filters. Try a different filter combination.'
		: query?.length
			? 'There were no courses that matched your query. Please try again.'
			: "You can search by Professor (e.g. 'Jill Dietz'), Course Name (e.g. 'Abstract Algebra'), Department/Number (e.g. MATH 252), or GE (e.g. WRI)"

	let messageView = <NoticeView style={styles.message} text={message} />

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

			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={messageView}
				ListHeaderComponent={header}
				contentContainerStyle={styles.contentContainer}
				contentInsetAdjustmentBehavior="automatic"
				keyExtractor={(item: CourseType) => item.clbid.toString()}
				keyboardDismissMode="interactive"
				renderItem={({item}) => <CourseRow course={item} onPress={handlePress} />}
				renderSectionHeader={({section: {title}}) => <ListSectionHeader title={parseTerm(title)} />}
				sections={results}
				{...largeListProps}
			/>
		</>
	)
}

let styles = StyleSheet.create({
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
