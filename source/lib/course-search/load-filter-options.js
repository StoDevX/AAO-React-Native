// @flow

import {GE_DATA, DEPT_DATA} from './urls'
import * as storage from '../storage'
import mapValues from 'lodash/mapValues'
import isEqual from 'lodash/isEqual'
import pProps from 'p-props'

const filterCategories = {
	'ges': { name: 'ges', url: GE_DATA },
	'departments': { name: 'departments', url: DEPT_DATA },
}

type FilterCategory = {name: string, url: string}

type AllFilterCategories = {
	ges: string[],
	departments: string[],
}

export async function loadCourseFilterOption(category: FilterCategory): Promise<Array<string>> {
	const remoteData = await fetchJson(category.url).catch(() => [])
	const storedData = await storage.getCourseFilterOption(category.name)
	if (!isEqual(remoteData, storedData) || storedData.length === 0) {
		storage.setCourseFilterOption(category.name, remoteData)
		return remoteData
	} else {
		return storedData
	}
}

export function loadAllCourseFilterOptions(): Promise<AllFilterCategories> {
	return pProps(mapValues(filterCategories, (category) => (loadCourseFilterOption(category))))
		.then(result => result);
}
