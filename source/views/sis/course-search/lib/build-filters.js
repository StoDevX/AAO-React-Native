// @flow

import {getTermInfo} from '../../../../lib/storage'
import {parseTerm} from '../../../../lib/course-search/parse-term'
import type {FilterType} from '../../../components/filter'
import {loadAllCourseFilterOptions} from '../../../../lib/course-search'

export async function buildFilters(): Promise<FilterType[]> {
	const terms = await getTermInfo()
	const allTerms = terms.map(term => ({
		title: term.term,
		label: parseTerm(term.term.toString()),
	}))

	const {ges, departments} = await loadAllCourseFilterOptions()

	const allGEs = ges.map(ge => ({
		title: ge,
	}))
	const allDepartments = departments.map(dep => ({
		title: dep,
	}))

	return [
		{
			type: 'toggle',
			key: 'status',
			enabled: false,
			spec: {
				label: 'Only Show Open Courses',
				caption:
					'Allows you to either see only courses that are open, or all courses.',
			},
			apply: {
				key: 'status',
				trueEquivalent: 'O',
			},
		},
		{
			type: 'toggle',
			key: 'type',
			enabled: false,
			spec: {
				label: 'Show Labs Only',
				caption: 'Allows you to only see labs.',
			},
			apply: {
				key: 'type',
				trueEquivalent: 'Lab',
			},
		},
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
		},
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
		},
		{
			type: 'list',
			key: 'departments',
			enabled: false,
			spec: {
				title: 'Departments',
				showImages: false,
				options: allDepartments,
				mode: 'OR',
				selected: allDepartments,
				displayTitle: true,
			},
			apply: {
				key: 'departments',
			},
		},
	]
}
