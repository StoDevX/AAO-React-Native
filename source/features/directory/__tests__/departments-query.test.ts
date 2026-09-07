import {describe, expect, test} from '@jest/globals'

import {directoryDepartmentsOptions} from '../departments-query'
import type {DepartmentListing} from '../types'

const dept = (name: string): DepartmentListing => ({
	name,
	buildingabbr: null,
	buildingname: null,
	buildingroom: null,
	email: null,
	extension: null,
	fax: null,
	headcount: 0,
	text: null,
	website: null,
})

describe('directoryDepartmentsOptions', () => {
	test('select sorts the rows by name', () => {
		let sorted = directoryDepartmentsOptions.select?.([
			dept('Theater'),
			dept('Art'),
			dept('Nursing'),
		])

		expect(sorted?.map((d) => d.name)).toEqual(['Art', 'Nursing', 'Theater'])
	})

	test('select does not mutate the input array', () => {
		let input = [dept('Theater'), dept('Art')]
		directoryDepartmentsOptions.select?.(input)

		expect(input.map((d) => d.name)).toEqual(['Theater', 'Art'])
	})
})
