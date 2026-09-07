import {describe, expect, test} from '@jest/globals'
import {filterBuildings} from '../filter-buildings'
import type {BuildingType} from '../../types'

function makeBuilding(overrides: Partial<BuildingType> & {name: string}): BuildingType {
	return {category: 'Academia', schedule: [], ...overrides}
}

const sections = [
	{
		title: 'Food',
		data: [makeBuilding({name: 'The Cage', category: 'Food'})],
	},
	{
		title: 'Libraries',
		data: [
			makeBuilding({name: 'Rølvaag Library', category: 'Libraries'}),
			makeBuilding({name: 'DiSCO', abbreviation: 'DSC', category: 'Libraries'}),
		],
	},
]

describe('filterBuildings', () => {
	test('returns every section when the query is empty', () => {
		expect(filterBuildings(sections, '')).toEqual(sections)
	})

	test('returns every section when the query is only whitespace', () => {
		expect(filterBuildings(sections, '   ')).toEqual(sections)
	})

	test('matches a name regardless of case', () => {
		let actual = filterBuildings(sections, 'the cage')

		expect(actual).toEqual([{title: 'Food', data: [sections[0]?.data[0]]}])
	})

	test('matches a name with a diacritic when the query has none', () => {
		let actual = filterBuildings(sections, 'rolvaag')

		expect(actual).toEqual([{title: 'Libraries', data: [sections[1]?.data[0]]}])
	})

	test('matches an abbreviation', () => {
		let actual = filterBuildings(sections, 'dsc')

		expect(actual).toEqual([{title: 'Libraries', data: [sections[1]?.data[1]]}])
	})

	test('drops sections left with nothing in them', () => {
		let actual = filterBuildings(sections, 'library')

		expect(actual.map((s) => s.title)).toEqual(['Libraries'])
	})

	test('returns no sections when nothing matches', () => {
		expect(filterBuildings(sections, 'zzzz')).toEqual([])
	})
})
