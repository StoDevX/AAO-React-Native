import {
	useQueries,
	useQuery,
	UseQueryOptions,
	UseQueryResult,
} from '@tanstack/react-query'
import {CourseType, TermType} from '../../../lib/course-search'
import {
	coursesForTerm,
	deptData,
	geData,
	infoJson,
} from '../../../lib/course-search/urls'

const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60
const ONE_HOUR = ONE_MINUTE * 60
const ONE_DAY = ONE_HOUR * 24

export const keys = {
	terms: ['catalog', 'terms'] as const,
	courses: (term: TermType) => ['catalog', 'courses', term] as const,
	gereqs: ['catalog', 'gereqs'] as const,
	departments: ['catalog', 'departments'] as const,
	times: ['catalog', 'times'] as const,
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

): UseQueryResult<CourseType[], unknown>[] {
	let {data: terms = []} = useAvailableTerms()

	let query = (
		term: TermType,
	): UseQueryOptions<
		CourseType[],
		unknown,
		CourseType[],
		ReturnType<(typeof keys)['courses']>
	> => ({
		queryKey: keys.courses(term),
		queryFn: ({queryKey: [_group, _courses, term], signal}) =>
			coursesForTerm(term, {signal}),
		staleTime: ONE_HOUR,
		enabled: terms.length > 0,
	})

	return useQueries({
		queries: terms.map(query),
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
