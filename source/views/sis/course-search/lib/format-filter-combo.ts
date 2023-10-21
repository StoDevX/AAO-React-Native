import type {FilterType} from '@frogpond/filter'
import {filterListSpecs} from '@frogpond/filter'

import {CourseType} from '../../../../lib/course-search'
import {formatTerms} from './format-terms'

export type FilterComboType = {
	filters: FilterType<CourseType>[]
	description: string
}

export function formatFilterCombo(
	filters: FilterType<CourseType>[],
): FilterComboType {
	let filterCombo = filters.filter((f) => f.enabled)
	let comboDescription = filterCombo
		.map((f) => describeFilter(f, filters))
		.join(', ')
	return {filters: filterCombo, description: comboDescription}
}

function describeFilter(
	f: FilterType<CourseType>,
	filters: FilterType<CourseType>[],
) {
	switch (f.key) {
		case 'level': {
			let levelFilter = filterListSpecs(filters).find((f) => f.key === 'level')
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
			let termFilter = filterListSpecs(filters).find((f) => f.key === 'term')
			let selectedTerms = termFilter ? termFilter.spec.selected : []
			let terms = selectedTerms.map((t) => parseInt(t.title))
			return formatTerms(terms)
		}
		case 'gereqs': {
			let geFilter = filterListSpecs(filters).find((f) => f.key === 'gereqs')
			let selectedGEs = geFilter ? geFilter.spec.selected : []
			return selectedGEs.map((ge) => ge.title).join('/')
		}
		case 'department': {
			let deptFilter = filterListSpecs(filters).find(
				(f) => f.key === 'department',
			)
			let selectedDepts = deptFilter ? deptFilter.spec.selected : []
			return selectedDepts.map((dept) => dept.title).join('/')
		}
		default:
			return ''
	}
}
