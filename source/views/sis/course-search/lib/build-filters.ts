import {parseTerm} from '../../../../lib/course-search/parse-term'
import type {Filter, ListFilter, ToggleFilter} from '@frogpond/filter'
import {CourseType} from '../../../../lib/course-search'
import {useAvailableTerms, useDepartments, useGeReqs} from '../query'

export function useFilters(): {
	isLoading: boolean
	data: Filter<CourseType>[]
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

	let spaceAvailableFilter: ToggleFilter<CourseType> = {
		type: 'toggle',
		active: false,
		field: 'spaceAvailable',
		title: 'Space Available',
	}

	let termFilter: ListFilter<CourseType> = {
		type: 'list',
		field: 'term',
		title: 'Terms',
		options: allTerms,
		mode: 'any',
		selectedIndices: [],
	}

	let gereqFilter: ListFilter<CourseType> = {
		type: 'list',
		field: 'gereqs',
		title: 'GEs',
		options: allGEs,
		mode: 'all',
		selectedIndices: [],
	}

	let departmentFilter: ListFilter<CourseType> = {
		type: 'list',
		field: 'department',
		title: 'Department',
		options: allDepartments,
		mode: 'any',
		selectedIndices: [],
	}

	let levelFilter: ListFilter<CourseType> = {
		type: 'list',
		field: 'level',
		title: 'Level',
		options: courseLevelOptions,
		mode: 'any',
		selectedIndices: [],
	}

	let courseStatusFilter: ToggleFilter<CourseType> = {
		type: 'toggle',
		field: 'isOpen',
		active: false,
		title: 'Only Open Courses',
	}

	let labsFilter: ToggleFilter<CourseType> = {
		type: 'toggle',
		field: 'isLab',
		active: false,
		title: 'Only Labs',
	}

	let response = [
		spaceAvailableFilter,
		termFilter,
		gereqFilter,
		departmentFilter,
		levelFilter,
		courseStatusFilter,
		labsFilter,
	]

	return {data: response, error: null, isLoading}
}
