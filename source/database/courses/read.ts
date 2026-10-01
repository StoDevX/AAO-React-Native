import {keepPreviousData, queryOptions, useQuery, type UseQueryResult} from '@tanstack/react-query'
import {isUITesting} from '@frogpond/launch-arguments'
import {now} from '@frogpond/timer'

import type {CourseType} from '../../lib/course-search/types.ts'
import {reportingFailures} from '../calendar/read.ts'
import {getRunner} from '../client.ts'
import {CATALOG_SCHEMA} from './fixture.ts'
import type {CourseFilters} from './filters.ts'
import {
	courseChildrenQueries,
	courseQuery,
	courseResultsQuery,
	filterOptionsQueries,
} from './queries.ts'
import {refreshCatalog} from './refresh.ts'
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
	let attached = runner
		.all<{name: string}>({sql: 'select name from pragma_database_list', params: []})
		.some((row) => row.name === CATALOG_SCHEMA)
	if (!attached) return false
	let [row] = runner.all<{n: number}>({
		sql: `select count(*) as n from (select 1 from ${CATALOG_SCHEMA}.section limit 1)`,
		params: [],
	})
	return (row?.n ?? 0) > 0
}

/** Course search's results, grouped by term, refreshed whenever a new catalog is swapped in. */
export function useCourseResults(args: {query: string; filters: CourseFilters}): {
	sections: Array<{title: string; data: CourseListItem[]}>
	hasCatalog: boolean
	isPending: boolean
	failed: boolean
} {
	let {query, filters} = args
	let revision = useCourseRevision()
	let result = useQuery({
		queryKey: [COURSE_READ_KEY, 'results', revision, query, filters],
		queryFn: () =>
			reportingFailures(() => {
				if (!catalogHasSections()) return {hasCatalog: false, sections: []}
				let rows = getRunner().all<CourseListRow>(courseResultsQuery({query, filters}))
				return {hasCatalog: true, sections: sectionsByTerm(rows.map(listItem))}
			}),
		placeholderData: keepPreviousData,
		meta: {persist: false},
	})
	return {
		sections: result.data?.sections ?? [],
		hasCatalog: result.data?.hasCatalog ?? false,
		isPending: result.isPending,
		failed: result.isError,
	}
}

/** One course, whole, or null when the catalog has no such course. */
export function useCourse(clbid: number): {course: CourseType | null | undefined; failed: boolean} {
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
	return {course: result.data, failed: result.isError}
}

/** The filter toolbar's options, from the terms of the last five years. */
export function useCourseFilterOptions(): {
	terms: number[]
	gereqs: string[]
	departments: string[]
} {
	let revision = useCourseRevision()
	let result = useQuery({
		queryKey: [COURSE_READ_KEY, 'filter-options', revision],
		queryFn: () =>
			reportingFailures(() => {
				if (!catalogHasSections()) return {terms: [], gereqs: [], departments: []}
				let runner = getRunner()
				// `year >= thisYear - 4` keeps the five years course search has always offered.
				let queries = filterOptionsQueries(now().year() - 4)
				return {
					terms: runner.all<{term: number}>(queries.terms).map((row) => row.term),
					gereqs: runner.all<{code: string}>(queries.gereqs).map((row) => row.code),
					departments: runner
						.all<{department: string}>(queries.departments)
						.map((row) => row.department),
				}
			}),
		meta: {persist: false},
	})
	return result.data ?? {terms: [], gereqs: [], departments: []}
}
