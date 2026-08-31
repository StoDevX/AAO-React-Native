import {parseTerm} from '../../../../lib/course-search/parse-term'
import type {FilterType, ListType, ToggleType} from '@frogpond/filter'
import {CourseType} from '../../../../lib/course-search'
import {availableTermsOptions, departmentsOptions, geReqsOptions} from '../query'
import {useQuery} from '@tanstack/react-query'

export function useFilters(): {
	isLoading: boolean
	data: FilterType<CourseType>[]
	error: null | Error
	refetch: () => void
} {
	let {
		data: terms = [],
		error: termError,
		isLoading: termsLoading,
		refetch: refetchTerms,
	} = useQuery(availableTermsOptions)

	let {
		data: geReqs = [],
		error: geReqError,
		isLoading: geReqsLoading,
		refetch: refetchGeReqs,
	} = useQuery(geReqsOptions)

	let {
		data: departments = [],
		error: departmentsError,
		isLoading: deptsLoading,
		refetch: refetchDepts,
	} = useQuery(departmentsOptions)

	let refetch = () => {
		void refetchTerms()
		void refetchGeReqs()
		void refetchDepts()
	}

	let isLoading = termsLoading || geReqsLoading || deptsLoading
	let error = termError || geReqError || departmentsError

	if (error) {
		return {data: [], error, isLoading, refetch}
	}

	let allTerms = terms
		.map((term) => ({
			title: String(term.term),
			label: parseTerm(term.term.toString()),
		}))
		.reverse()

	let allGEs = geReqs.map((ge) => ({title: ge}))
	let allDepartments = departments.map((dep) => ({title: dep}))
	let courseLevelOptions = [{title: '100'}, {title: '200'}, {title: '300'}]

	let response = [
		{
			type: 'toggle',
			key: 'spaceAvailable',
			enabled: false,
			spec: {
				label: 'Space Available',
				title: 'Enrollment',
			},
			apply: {
				key: 'spaceAvailable',
			},
		} as ToggleType<CourseType>,
		{
			type: 'list',
			key: 'term',
			enabled: false,
			spec: {
				title: 'Terms',
				options: allTerms,
				mode: 'OR',
				selected: [],
				displayTitle: false,
			},
			apply: {
				key: 'term',
			},
		} as ListType<CourseType>,
		{
			type: 'list',
			key: 'gereqs',
			enabled: false,
			spec: {
				title: 'GEs',
				showIcons: false,
				options: allGEs,
				mode: 'AND',
				selected: [],
				displayTitle: true,
			},
			apply: {
				key: 'gereqs',
			},
		} as ListType<CourseType>,
		{
			type: 'list',
			key: 'department',
			enabled: false,
			spec: {
				title: 'Department',
				showIcons: false,
				options: allDepartments,
				mode: 'OR',
				selected: [],
				displayTitle: true,
			},
			apply: {
				key: 'department',
			},
		} as ListType<CourseType>,
		{
			type: 'list',
			key: 'level',
			enabled: false,
			spec: {
				title: 'Level',
				showIcons: false,
				options: courseLevelOptions,
				mode: 'OR',
				selected: [],
				displayTitle: true,
			},
			apply: {
				key: 'level',
			},
		} as ListType<CourseType>,
		{
			type: 'toggle',
			key: 'status',
			enabled: false,
			spec: {
				label: 'Open Courses',
				title: 'Status',
			},
			apply: {
				key: 'status',
				trueEquivalent: 'O',
			},
		} as ToggleType<CourseType>,
		{
			type: 'toggle',
			key: 'type',
			enabled: false,
			spec: {
				label: 'Lab Only',
				title: 'Lab',
			},
			apply: {
				key: 'type',
				trueEquivalent: 'Lab',
			},
		} as ToggleType<CourseType>,
	]

	return {data: response, error: null, isLoading, refetch}
}
