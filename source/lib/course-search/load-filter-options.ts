import {geData, deptData} from './urls'
import mapValues from 'lodash/mapValues'
import pProps from 'p-props'

const filterCategories = {
	ges: {name: 'ges', fetch: geData} as const,
	departments: {name: 'departments', fetch: deptData} as const,
}

type AllFilterCategories = {
	ges: string[]
	departments: string[]
}

export function loadAllCourseFilterOptions(): Promise<AllFilterCategories> {
	return pProps(mapValues(filterCategories, (category) => category.fetch()))
}
