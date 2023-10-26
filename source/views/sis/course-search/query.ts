import {CourseType, TermType} from '../../../lib/course-search'
import {
	coursesForTerm,
	deptData,
	geData,
	infoJson,
} from '../../../lib/course-search/urls'
import {
	useQueries,
	useQuery,
	UseQueryOptions,
	UseQueryResult,
} from '@tanstack/react-query'

const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60
const ONE_HOUR = ONE_MINUTE * 60
const ONE_DAY = ONE_HOUR * 24

export const keys = {
	terms: ['catalog', 'terms'] as const,
	courses: (term: TermType, levels: Array<number>, gereqs: Array<string>) =>
		['catalog', 'courses', term, levels, gereqs] as const,
	gereqs: ['catalog', 'gereqs'] as const,
	departments: ['catalog', 'departments'] as const,
	times: ['catalog', 'times'] as const,
	levels: ['catalog', 'levels'] as const,
}

export function useAvailableTerms(): UseQueryResult<TermType[], unknown> {
	return useQuery({
		queryKey: keys.terms,
		queryFn: async ({signal}) => {
			const resp = await infoJson({signal})
			return resp.files
		},
		select: (data) => {
			const thisYear = new Date().getFullYear()
			return data.filter(
				(file) => file.type === 'json' && file.year > thisYear - 5,
			)
		},
		staleTime: ONE_DAY,
	})
}

export function useCourseData(
	selectedTerms: Array<number> = [],
	levels: Array<number> = [],
	gereqs: Array<string> = [],
): UseQueryResult<CourseType[], unknown>[] {
	let {data: terms = []} = useAvailableTerms()
	let filteredTerms = terms.filter((t) => selectedTerms.includes(t.term))

	let query = (
		term: TermType,
		levels: Array<number> = [],
		gereqs: Array<string> = [],
	): UseQueryOptions<
		CourseType[],
		unknown,
		CourseType[],
		ReturnType<(typeof keys)['courses']>
	> => ({
		queryKey: keys.courses(term, levels, gereqs),
		queryFn: ({queryKey: [_group, _courses, term, levels, gereqs], signal}) =>
			coursesForTerm(term, levels, gereqs, {signal}),
		staleTime: ONE_HOUR,
		enabled: terms.length > 0,
	})

	return useQueries({
		queries: filteredTerms.length
			? filteredTerms.map((term) => query(term, levels, gereqs))
			: terms.map((term) => query(term, levels, gereqs)),
	})
}

export function useGeReqs(): UseQueryResult<string[]> {
	return useQuery({
		queryKey: keys.gereqs,
		queryFn: ({signal}) => geData({signal}),
		staleTime: ONE_DAY,
	})
}

export function useDepartments(): UseQueryResult<string[]> {
	return useQuery({
		queryKey: keys.departments,
		queryFn: ({signal}) => deptData({signal}),
		staleTime: ONE_DAY,
	})
}
