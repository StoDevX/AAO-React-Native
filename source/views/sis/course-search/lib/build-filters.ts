import {parseTerm} from '../../../../lib/course-search/parse-term'
import type {FilterType, ListType, ToggleType} from '@frogpond/filter'
import {CourseType} from '../../../../lib/course-search'
import {useAvailableTerms, useDepartments, useGeReqs} from '../query'

export function useFilters(): {
	isLoading: boolean
	data: FilterType<CourseType>[]
	error: unknown
} {
	let {
		data: terms = [],
		error: termError,
		isLoading: termsLoading,
	} = useAvailableTerms()

	let {
		data: geReqs = [],
		error: geReqError,
		isLoading: geReqsLoading,
	} = useGeReqs()

	let {
		data: departments = [],
		error: departmentsError,
		isLoading: deptsLoading,
	} = useDepartments()

	let isLoading = termsLoading || geReqsLoading || deptsLoading
	let error = termError || geReqError || departmentsError

	if (error) {
		return {data: [], error, isLoading}
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
				caption: 'When activated, shows only courses with space available.',
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
				selected: allTerms,
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
				showImages: false,
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
				showImages: false,
				options: allDepartments,
				mode: 'OR',
				selected: allDepartments,
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
				showImages: false,
				options: courseLevelOptions,
				mode: 'OR',
				selected: courseLevelOptions,
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
				caption:
					'Allows you to either see only courses that are open, or all courses.',
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
				caption: 'Allows you to only see labs.',
			},
			apply: {
				key: 'type',
				trueEquivalent: 'Lab',
			},
		} as ToggleType<CourseType>,
	]

	return {data: response, error: null, isLoading}
}
