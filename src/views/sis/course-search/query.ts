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
	courses: (term: TermType, levels: Array<number>, gereqs: Array<string>) =>
		['catalog', 'courses', term, levels, gereqs] as const,
	gereqs: ['catalog', 'gereqs'] as const,
	departments: ['catalog', 'departments'] as const,
	times: ['catalog', 'times'] as const,
	levels: ['catalog', 'levels'] as const,
}

export function useAvailableTerms(): UseQueryResult<TermType[], Error> {
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
): UseQueryResult<CourseType[], Error>[] {
	let {data: terms = []} = useAvailableTerms()
	let filteredTerms = terms.filter((t) => selectedTerms.includes(t.term))

	let createQueryOptions = (
		term: TermType,
		levelsList: Array<number> = [],
		gereqsList: Array<string> = [],
	): UseQueryOptions<
		CourseType[],
		Error,
		CourseType[],
		ReturnType<(typeof keys)['courses']>
	> => ({
		queryKey: keys.courses(term, levelsList, gereqsList),
		queryFn: ({
			queryKey: [_group, _courses, termKey, levelsKey, gereqsKey],
			signal,
		}) => coursesForTerm(termKey, levelsKey, gereqsKey, {signal}),
		staleTime: ONE_HOUR,
		enabled: terms.length > 0,
	})

	return useQueries({
		queries: filteredTerms.length
			? filteredTerms.map((term) => createQueryOptions(term, levels, gereqs))
			: terms.map((term) => createQueryOptions(term, levels, gereqs)),
	})
}

export function useGeReqs(): UseQueryResult<string[], Error> {
	return useQuery({
		queryKey: keys.gereqs,
		queryFn: ({signal}) => geData({signal}),
		staleTime: ONE_DAY,
	})
}

export function useDepartments(): UseQueryResult<string[], Error> {
	return useQuery({
		queryKey: keys.departments,
		queryFn: ({signal}) => deptData({signal}),
		staleTime: ONE_DAY,
	})
}
