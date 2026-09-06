import {describe, expect, test} from '@jest/globals'
import type {CourseType} from '../../../../../lib/course-search'
import {applySearch} from '../execute-search'

function makeCourse(overrides: Partial<CourseType> = {}): CourseType {
	return {
		clbid: 1,
		credits: 1,
		crsid: 1,
		department: 'SPAN',
		enrolled: 0,
		instructors: ['Ford Prefect'],
		level: 100,
		max: 20,
		name: 'Beginning Spanish',
		number: 101,
		offerings: [],
		spaceAvailable: true,
		pn: false,
		prerequisites: false,
		semester: 1,
		status: 'O',
		term: 20241,
		title: 'Beginning Spanish',
		type: 'Research',
		year: 2024,
		...overrides,
	}
}

describe('applySearch', () => {
	test('matches a course whose name contains the query', () => {
		expect(applySearch('spanish', makeCourse())).toBe(true)
	})

	test('matches a course by instructor name', () => {
		let course = makeCourse({name: 'Organic Chemistry', title: 'Organic Chemistry'})
		expect(applySearch('prefect', course)).toBe(true)
	})

	test('does not match when the query is absent from every field', () => {
		expect(applySearch('astronomy', makeCourse())).toBe(false)
	})

	test('handles a course with no instructors field', () => {
		let course = makeCourse({
			name: 'Organic Chemistry',
			title: 'Organic Chemistry',
			instructors: undefined,
		})
		expect(applySearch('spanish', course)).toBe(false)
	})
})
