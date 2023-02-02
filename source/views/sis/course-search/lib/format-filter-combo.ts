import {isFilterEnabled, isListFilter, type Filter} from '@frogpond/filter'

import {formatTerms} from './format-terms'
import {CourseType} from '../../../../lib/course-search'

export type FilterComboType = {
	filters: Filter<CourseType>[]
	description: string
}

export function formatFilterCombo(
	filters: Filter<CourseType>[],
): FilterComboType {
	let filterCombo = filters.filter(isFilterEnabled)
	let comboDescription = filterCombo.map(describeFilter).join(', ')
	return {filters: filterCombo, description: comboDescription}
}

function describeFilter(f: Filter<CourseType>): string {
	if (!isListFilter(f)) {
		return ''
	}

	let fieldName = f.field as keyof CourseType

	switch (fieldName) {
		case 'level': {
			return (
				f.selectedIndices.map((index) => f.options[index].title).join('/') +
				' Level'
			)
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
			return formatTerms(
				f.selectedIndices.map((index) => parseInt(f.options[index].title)),
			)
		}
		case 'gereqs': {
			return f.selectedIndices.map((index) => f.options[index].title).join('/')
		}
		case 'department': {
			return f.selectedIndices.map((index) => f.options[index].title).join('/')
		}
		default:
			return ''
	}
}
