import {filterListSpecs} from '@frogpond/filter'
import type {Filter} from '@frogpond/filter'
import {formatTerms} from './format-terms'
import {CourseType} from '../../../../lib/course-search'

export type FilterComboType = {
	filters: Filter<CourseType>[]
	description: string
}

export function formatFilterCombo(
	filters: Filter<CourseType>[],
): FilterComboType {
	let filterCombo = filters.filter((f) => f.enabled)
	let comboDescription = filterCombo
		.map((f) => describeFilter(f, filters))
		.join(', ')
	return {filters: filterCombo, description: comboDescription}
}

function describeFilter(
	f: Filter<CourseType>,
	filters: Filter<CourseType>[],
) {
	switch (f.key) {
		case 'level': {
			let levelFilter = filterListSpecs(filters).find((f) => f.key === 'level')
			let selectedLevels = levelFilter ? levelFilter.config.selected : []
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
			let selectedTerms = termFilter ? termFilter.config.selected : []
			let terms = selectedTerms.map((t) => parseInt(t.title))
			return formatTerms(terms)
		}
		case 'gereqs': {
			let geFilter = filterListSpecs(filters).find((f) => f.key === 'gereqs')
			let selectedGEs = geFilter ? geFilter.config.selected : []
			return selectedGEs.map((ge) => ge.title).join('/')
		}
		case 'department': {
			let deptFilter = filterListSpecs(filters).find(
				(f) => f.key === 'department',
			)
			let selectedDepts = deptFilter ? deptFilter.config.selected : []
			return selectedDepts.map((dept) => dept.title).join('/')
		}
		default:
			return ''
	}
}
