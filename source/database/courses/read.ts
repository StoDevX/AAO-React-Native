import * as React from 'react'
import {
	keepPreviousData,
	queryOptions,
	useInfiniteQuery,
	useQuery,
	type UseQueryResult,
} from '@tanstack/react-query'
import {isUITesting} from '@frogpond/launch-arguments'
import {now} from '@frogpond/timer'

import type {CourseType} from '../../lib/course-search/types.ts'
import {reportingFailures} from '../calendar/read.ts'
import {getRunner} from '../client.ts'
import type {CourseFilters} from './filters.ts'
import {
	courseChildrenQueries,
	courseQuery,
	courseResultsQuery,
	filterOptionsQueries,
} from './queries.ts'
import {isAttached} from './index-build.ts'
import {refreshCatalog, shouldRetryCatalog} from './refresh.ts'
import {useCourseRevision} from './revision.ts'
import {
	hydrateCourse,
	listItem,
	sectionsByTerm,
	type CourseChildren,
	type CourseListItem,
	type CourseListRow,
	type CourseRow,
} from './rows.ts'
import {CATALOG_SCHEMA} from './schema.ts'

const ONE_HOUR = 60 * 60 * 1000

/**
 * Keeps the course catalog current. Not persisted: the file on disk is the
 * copy, and what this resolves is only which download is stored.
 */
export const courseCatalogOptions = queryOptions({
	queryKey: ['catalog', 'course-catalog'] as const,
	queryFn: ({signal}) =>
		isUITesting ? Promise.resolve({etag: 'uitest', changed: false}) : refreshCatalog(signal),
	staleTime: ONE_HOUR,
	retry: shouldRetryCatalog,
	meta: {persist: false},
})

export function useCourseCatalog(): UseQueryResult<{etag: string; changed: boolean}, Error> {
	return useQuery(courseCatalogOptions)
}

/** The head of every course read's key; these reads are never persisted. */
export const COURSE_READ_KEY = 'course-db'

/** Whether a catalog with at least one section is attached. */
function catalogHasSections(): boolean {
	let runner = getRunner()
	if (!isAttached(runner, CATALOG_SCHEMA)) return false
	let [row] = runner.all<{n: number}>({
		sql: `select count(*) as n from (select 1 from ${CATALOG_SCHEMA}.section limit 1)`,
		params: [],
	})
	return (row?.n ?? 0) > 0
}

/**
 * How many result rows a read fetches: several screens' worth, while reading
 * a page costs about what a typical search does rather than what listing
 * every course would.
 */
export const COURSE_PAGE_SIZE = 200

type ResultsPageData = {hasCatalog: boolean; items: CourseListItem[]}

/**
 * Course search's results, grouped by term, a page at a time; `loadMore` reads
 * the next page. Refreshed whenever a new catalog is swapped in.
 */
export function useCourseResults(args: {
	query: string
	filters: CourseFilters
	/** False until the filters are known: before then there are no terms to search. */
	enabled?: boolean
}): {
	sections: Array<{title: string; data: CourseListItem[]}>
	hasCatalog: boolean
	hasMore: boolean
	loadMore: () => void
	isPending: boolean
	failed: boolean
	/** Runs the read again; a failed one keeps its key until the catalog changes. */
	retry: () => void
} {
	let {query, filters, enabled = true} = args
	let revision = useCourseRevision()
	let result = useInfiniteQuery({
		enabled,
		queryKey: [COURSE_READ_KEY, 'results', revision, query, filters],
		queryFn: ({pageParam}): ResultsPageData =>
			reportingFailures(() => {
				if (!catalogHasSections()) return {hasCatalog: false, items: []}
				let page = {offset: pageParam, limit: COURSE_PAGE_SIZE}
				let rows = getRunner().all<CourseListRow>(courseResultsQuery({query, filters, page}))
				return {hasCatalog: true, items: rows.map(listItem)}
			}),
		initialPageParam: 0,
		// A full page may have more after it; a short one is the last.
		getNextPageParam: (last, pages) =>
			last.items.length === COURSE_PAGE_SIZE ? pages.length * COURSE_PAGE_SIZE : undefined,
		placeholderData: keepPreviousData,
		meta: {persist: false},
	})

	let pages = result.data?.pages
	let sections = React.useMemo(
		() => sectionsByTerm((pages ?? []).flatMap((page) => page.items)),
		[pages],
	)
	let {hasNextPage, isFetchingNextPage, fetchNextPage, refetch} = result
	let loadMore = React.useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	return {
		sections,
		hasCatalog: pages?.[0]?.hasCatalog ?? false,
		hasMore: hasNextPage,
		loadMore,
		isPending: result.isPending,
		failed: result.isError,
		retry: React.useCallback(() => void refetch(), [refetch]),
	}
}

/** One course, whole, or null when the catalog has no such course. */
export function useCourse(clbid: number): {
	course: CourseType | null | undefined
	failed: boolean
	/** Runs the read again; a failed one keeps its key until the catalog changes. */
	retry: () => void
} {
	let revision = useCourseRevision()
	let result = useQuery({
		queryKey: [COURSE_READ_KEY, 'course', revision, clbid],
		queryFn: () =>
			reportingFailures(() => {
				if (!catalogHasSections()) return null
				let runner = getRunner()
				let [row] = runner.all<CourseRow>(courseQuery(clbid))
				if (!row) return null
				let queries = courseChildrenQueries(clbid)
				let children: CourseChildren = {
					gereqs: runner.all(queries.gereqs),
					instructors: runner.all(queries.instructors),
					offerings: runner.all(queries.offerings),
				}
				return hydrateCourse(row, children)
			}),
		meta: {persist: false},
	})
	let {refetch} = result
	return {
		course: result.data,
		failed: result.isError,
		retry: React.useCallback(() => void refetch(), [refetch]),
	}
}

/** The filter toolbar's options, from the terms of the last five years. */
export function useCourseFilterOptions(): {
	terms: number[]
	gereqs: string[]
	departments: string[]
	isPending: boolean
} {
	let revision = useCourseRevision()
	let result = useQuery({
		queryKey: [COURSE_READ_KEY, 'filter-options', revision],
		queryFn: () =>
			reportingFailures(() => {
				if (!catalogHasSections()) return {terms: [], gereqs: [], departments: []}
				let runner = getRunner()
				// `year >= thisYear - 4` offers the five most recent academic years.
				let queries = filterOptionsQueries(now().year() - 4)
				return {
					terms: runner.all<{term: number}>(queries.terms).map((row) => row.term),
					gereqs: runner.all<{code: string}>(queries.gereqs).map((row) => row.code),
					departments: runner
						.all<{department: string}>(queries.departments)
						.map((row) => row.department),
				}
			}),
		// A new catalog re-keys this read; the old options stand in until it lands.
		placeholderData: keepPreviousData,
		meta: {persist: false},
	})
	return {...(result.data ?? {terms: [], gereqs: [], departments: []}), isPending: result.isPending}
}
