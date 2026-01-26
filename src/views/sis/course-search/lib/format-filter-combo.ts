import {filterListSpecs} from '@frogpond/filter'
import type {FilterType} from '@frogpond/filter'
import {formatTerms} from './format-terms'
import {CourseType} from '../../../../lib/course-search'

export type FilterComboType = {
	filters: FilterType<CourseType>[]
	description: string
}

export function formatFilterCombo(
	filters: FilterType<CourseType>[],
): FilterComboType {
	let filterCombo = filters.filter((filter) => filter.enabled)
	let comboDescription = filterCombo
		.map((filter) => describeFilter(filter, filters))
		.join(', ')
	return {filters: filterCombo, description: comboDescription}
}

function describeFilter(
	filter: FilterType<CourseType>,
	filters: FilterType<CourseType>[],
) {
	switch (filter.key) {
		case 'level': {
			let levelFilter = filterListSpecs(filters).find(
				(specFilter) => specFilter.key === 'level',
			)
			let selectedLevels = levelFilter ? levelFilter.spec.selected : []
			return selectedLevels.map((level) => level.title).join('/') + ' Level'
		}
		case 'spaceAvailable': {
			return 'Space Available'
		}
		case 'status': {
			return 'Open Courses'
		}
		case 'type': {
			return 'Labs Only'
		}
		case 'term': {
			let termFilter = filterListSpecs(filters).find(
				(specFilter) => specFilter.key === 'term',
			)
			let selectedTerms = termFilter ? termFilter.spec.selected : []
			let terms = selectedTerms.map((t) => parseInt(t.title, 10))
			return formatTerms(terms)
		}
		case 'gereqs': {
			let geFilter = filterListSpecs(filters).find(
				(specFilter) => specFilter.key === 'gereqs',
			)
			let selectedGEs = geFilter ? geFilter.spec.selected : []
			return selectedGEs.map((ge) => ge.title).join('/')
		}
		case 'department': {
			let deptFilter = filterListSpecs(filters).find(
				(specFilter) => specFilter.key === 'department',
			)
			let selectedDepts = deptFilter ? deptFilter.spec.selected : []
			return selectedDepts.map((dept) => dept.title).join('/')
		}
		default:
			return ''
	}
}
