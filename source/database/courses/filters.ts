import type {Filter} from '@frogpond/filter'

import type {CourseType} from '../../lib/course-search/types.ts'

/** What the course search toolbar asks for, as plain values. */
export type CourseFilters = {
	/** The terms to search: the chosen ones, or every term on offer when none is chosen. */
	terms: number[]
	spaceAvailable: boolean
	openOnly: boolean
	labOnly: boolean
	departments: string[]
	levels: number[]
	gereqs: string[]
	gereqMode: 'AND' | 'OR'
}

function selectedTitles(filter: Filter<CourseType> | undefined): string[] {
	if (filter?.type !== 'list' || !filter.enabled) return []
	return filter.spec.selected.map((option) => String(option.title))
}

function isOn(filter: Filter<CourseType> | undefined): boolean {
	return filter?.type === 'toggle' && filter.enabled
}

/** The toolbar's filters as `CourseFilters`; `allTerms` stands in for an empty Terms choice. */
export function courseFilters(filters: Filter<CourseType>[], allTerms: number[]): CourseFilters {
	let byKey = new Map(filters.map((filter) => [filter.key, filter]))
	let chosenTerms = selectedTitles(byKey.get('term')).map(Number)
	let gereqFilter = byKey.get('gereqs')

	return {
		terms: chosenTerms.length > 0 ? chosenTerms : allTerms,
		spaceAvailable: isOn(byKey.get('spaceAvailable')),
		openOnly: isOn(byKey.get('status')),
		labOnly: isOn(byKey.get('type')),
		departments: selectedTitles(byKey.get('department')),
		levels: selectedTitles(byKey.get('level')).map(Number),
		gereqs: selectedTitles(gereqFilter),
		gereqMode: gereqFilter?.type === 'list' ? gereqFilter.spec.mode : 'AND',
	}
}
