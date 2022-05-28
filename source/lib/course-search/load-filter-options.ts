import {fetch} from '@frogpond/fetch'
import {GE_DATA, DEPT_DATA} from './urls'
import mapValues from 'lodash/mapValues'
import pProps from 'p-props'

const filterCategories = {
	ges: {name: 'ges', url: GE_DATA},
	departments: {name: 'departments', url: DEPT_DATA},
}

type FilterCategory = {name: string; url: string}

type AllFilterCategories = {
	ges: string[]
	departments: string[]
}

export function loadAllCourseFilterOptions(): Promise<AllFilterCategories> {
	return pProps(
		mapValues(filterCategories, (category: FilterCategory) =>
			fetch(category.url).json<string[]>(),
		),
	)
}
