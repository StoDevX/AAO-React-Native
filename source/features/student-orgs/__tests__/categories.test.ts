import {describe, expect, test} from '@jest/globals'
import {goldGradient, grayGradient} from '@frogpond/colors'

import {buildCategoryTiles, categoriesFor, groupOrgsByCategory} from '../categories'
import type {OrgCategoryType, StudentOrgType} from '../types'

function makeOrg(overrides: Partial<StudentOrgType> = {}): StudentOrgType {
	return {
		meetings: '',
		contacts: [],
		advisors: [],
		description: '',
		category: 'Academic',
		lastUpdated: '',
		website: '',
		name: 'Test Org',
		...overrides,
	}
}

describe('categoriesFor', () => {
	test('a single category returns one entry', () => {
		expect(categoriesFor(makeOrg({category: 'Academic'}))).toEqual(['Academic'])
	})

	test('a comma-separated category splits into multiple entries', () => {
		expect(categoriesFor(makeOrg({category: 'Special Interest, Performance'}))).toEqual([
			'Special Interest',
			'Performance',
		])
	})

	test('trims whitespace around each category', () => {
		expect(categoriesFor(makeOrg({category: 'Academic,  Service ,Religious'}))).toEqual([
			'Academic',
			'Service',
			'Religious',
		])
	})

	test('drops empty entries from a trailing comma', () => {
		expect(categoriesFor(makeOrg({category: 'Academic, '}))).toEqual(['Academic'])
	})

	test('an empty category string returns no entries', () => {
		expect(categoriesFor(makeOrg({category: ''}))).toEqual([])
	})
})

describe('groupOrgsByCategory', () => {
	test('groups orgs under their single category', () => {
		let academic = makeOrg({name: 'A', category: 'Academic'})
		let service = makeOrg({name: 'B', category: 'Service'})

		let grouped = groupOrgsByCategory([academic, service])

		expect(grouped.get('Academic')).toEqual([academic])
		expect(grouped.get('Service')).toEqual([service])
	})

	test('a multi-category org appears under every one of its categories', () => {
		let org = makeOrg({name: 'Choir', category: 'Special Interest, Performance'})

		let grouped = groupOrgsByCategory([org])

		expect(grouped.get('Special Interest')).toEqual([org])
		expect(grouped.get('Performance')).toEqual([org])
	})

	test('an org with no category is grouped under nothing', () => {
		let org = makeOrg({category: ''})

		let grouped = groupOrgsByCategory([org])

		expect(grouped.size).toBe(0)
	})
})

describe('buildCategoryTiles', () => {
	let curated: OrgCategoryType[] = [
		{name: 'Academic', icon: 'graduationcap.fill', gradient: 'gold'},
	]

	test('a curated category gets its own icon and gradient', () => {
		let orgs = [makeOrg({category: 'Academic'})]

		let tiles = buildCategoryTiles(curated, orgs)

		expect(tiles).toEqual([
			{name: 'Academic', icon: 'graduationcap.fill', gradient: goldGradient, count: 1},
		])
	})

	test('an uncurated category still gets a tile, with the fallback icon and gray gradient', () => {
		let orgs = [makeOrg({category: 'Robotics'})]

		let tiles = buildCategoryTiles(curated, orgs)

		expect(tiles).toEqual([
			{name: 'Robotics', icon: 'person.3.fill', gradient: grayGradient, count: 1},
		])
	})

	test('counts every org in a category, including multi-category ones', () => {
		let orgs = [
			makeOrg({name: 'A', category: 'Academic'}),
			makeOrg({name: 'B', category: 'Academic, Service'}),
		]

		let tiles = buildCategoryTiles(curated, orgs)
		let academicTile = tiles.find((tile) => tile.name === 'Academic')

		expect(academicTile?.count).toBe(2)
	})

	test('a curated category with no current orgs produces no tile', () => {
		let tiles = buildCategoryTiles(curated, [])

		expect(tiles).toEqual([])
	})
})
