import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import type {Filter} from '@frogpond/filter'

import type {CourseType} from '../../lib/course-search/types.ts'
import {courseFilters} from './filters.ts'

function list(
	key: string,
	titles: string[],
	enabled = true,
	mode: 'AND' | 'OR' = 'OR',
): Filter<CourseType> {
	let options = titles.map((title) => ({title}))
	return {
		type: 'list',
		key,
		enabled,
		spec: {title: key, options, selected: options, mode},
		apply: {key: key as keyof CourseType},
	} as Filter<CourseType>
}

function toggle(key: string, enabled: boolean): Filter<CourseType> {
	return {
		type: 'toggle',
		key,
		enabled,
		spec: {label: key, title: key},
		apply: {key: key as keyof CourseType},
	} as Filter<CourseType>
}

describe('courseFilters', () => {
	it('asks for every offered term and nothing else when no filter is on', () => {
		assert.deepEqual(
			courseFilters([toggle('status', false), list('department', ['MATH'], false)], [20262, 20261]),
			{
				terms: [20262, 20261],
				spaceAvailable: false,
				openOnly: false,
				labOnly: false,
				departments: [],
				levels: [],
				gereqs: [],
				gereqMode: 'AND',
			},
		)
	})

	it('reads each enabled filter', () => {
		let result = courseFilters(
			[
				list('term', ['20262']),
				toggle('spaceAvailable', true),
				toggle('status', true),
				toggle('type', true),
				list('department', ['MATH']),
				list('level', ['100', '300']),
				list('gereqs', ['WRI', 'SED'], true, 'OR'),
			],
			[20261, 20262],
		)
		assert.deepEqual(result, {
			terms: [20262],
			spaceAvailable: true,
			openOnly: true,
			labOnly: true,
			departments: ['MATH'],
			levels: [100, 300],
			gereqs: ['WRI', 'SED'],
			gereqMode: 'OR',
		})
	})
})
