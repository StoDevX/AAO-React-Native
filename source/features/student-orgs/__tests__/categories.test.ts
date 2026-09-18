import {describe, expect, test} from '@jest/globals'
import {goldGradient, grayGradient} from '@frogpond/colors'

import {buildCategoryTiles, orgsInCategory} from '../categories'
import type {OrgCategoryMembership, OrgCategoryType, StudentOrgType} from '../types'

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
		organizationUri: 'test-org',
		memberCount: 0,
		...overrides,
	}
}

function makeMembership(overrides: Partial<OrgCategoryMembership> = {}): OrgCategoryMembership {
	return {
		catIdh: 'abc123',
		name: 'Academic',
		organizationUris: [],
		...overrides,
	}
}

describe('buildCategoryTiles', () => {
	let curated: OrgCategoryType[] = [
		{name: 'Academic', icon: 'graduationcap.fill', gradient: 'gold'},
	]

	test('a curated category gets its own icon and gradient', () => {
		let memberships = [makeMembership({name: 'Academic', organizationUris: ['a']})]

		let tiles = buildCategoryTiles(curated, memberships)

		expect(tiles).toEqual([
			{name: 'Academic', icon: 'graduationcap.fill', gradient: goldGradient, count: 1},
		])
	})

	test('an uncurated category still gets a tile, with the fallback icon and gray gradient', () => {
		let memberships = [makeMembership({name: 'Robotics', organizationUris: ['a']})]

		let tiles = buildCategoryTiles(curated, memberships)

		expect(tiles).toEqual([
			{name: 'Robotics', icon: 'person.3.fill', gradient: grayGradient, count: 1},
		])
	})

	test('count comes from the membership row, not any org list', () => {
		let memberships = [makeMembership({name: 'Academic', organizationUris: ['a', 'b', 'c']})]

		let tiles = buildCategoryTiles(curated, memberships)

		expect(tiles[0]?.count).toBe(3)
	})

	test('an empty membership list produces no tiles', () => {
		expect(buildCategoryTiles(curated, [])).toEqual([])
	})
})

describe('orgsInCategory', () => {
	test('returns only orgs whose organizationUri is in the membership', () => {
		let a = makeOrg({name: 'A', organizationUri: 'a'})
		let b = makeOrg({name: 'B', organizationUri: 'b'})
		let c = makeOrg({name: 'C', organizationUri: 'c'})
		let membership = makeMembership({organizationUris: ['a', 'c']})

		expect(orgsInCategory([a, b, c], membership)).toEqual([a, c])
	})

	test('an org not present in the membership uris is excluded', () => {
		let org = makeOrg({organizationUri: 'not-listed'})
		let membership = makeMembership({organizationUris: ['something-else']})

		expect(orgsInCategory([org], membership)).toEqual([])
	})

	test('an empty org list returns nothing', () => {
		let membership = makeMembership({organizationUris: ['a']})
		expect(orgsInCategory([], membership)).toEqual([])
	})
})
