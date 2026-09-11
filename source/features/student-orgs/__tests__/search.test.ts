import {describe, expect, test} from '@jest/globals'

import {filterAndGroupOrgs} from '../search'
import type {StudentOrgType} from '../types'

/**
 * `$groupableName` is server enrichment `StudentOrgType` doesn't declare
 * (see `search.ts`) -- this local type lets tests set it without a cast.
 */
type GroupableOrg = StudentOrgType & {$groupableName: string}

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

describe('filterAndGroupOrgs', () => {
	test('an empty query returns every org', () => {
		let orgs = [makeOrg({name: 'A'}), makeOrg({name: 'B'})]

		let sections = filterAndGroupOrgs(orgs, '')
		let allOrgs = sections.flatMap((section) => section.data)

		expect(allOrgs).toHaveLength(2)
	})

	test('a query matches by name', () => {
		let orgs = [makeOrg({name: 'Chess Club'}), makeOrg({name: 'Debate Team'})]

		let sections = filterAndGroupOrgs(orgs, 'chess')
		let allOrgs = sections.flatMap((section) => section.data)

		expect(allOrgs.map((org) => org.name)).toEqual(['Chess Club'])
	})

	test('a query matches by category', () => {
		let orgs = [makeOrg({name: 'Chess Club', category: 'Special Interest'})]

		let sections = filterAndGroupOrgs(orgs, 'special')

		expect(sections.flatMap((section) => section.data)).toHaveLength(1)
	})

	test('a query matches by description', () => {
		let orgs = [makeOrg({name: 'Chess Club', description: 'Weekly tournaments'})]

		let sections = filterAndGroupOrgs(orgs, 'tournament')

		expect(sections.flatMap((section) => section.data)).toHaveLength(1)
	})

	test('a mixed-case query still matches', () => {
		let orgs = [makeOrg({name: 'Chess Club'})]

		let sections = filterAndGroupOrgs(orgs, 'Chess')

		expect(sections.flatMap((section) => section.data)).toHaveLength(1)
	})

	test('orgs are grouped into sections by $groupableName', () => {
		let orgs: GroupableOrg[] = [
			{...makeOrg({name: 'Chess Club'}), $groupableName: 'C'},
			{...makeOrg({name: 'Ski Club'}), $groupableName: 'S'},
		]

		let sections = filterAndGroupOrgs(orgs, '')

		expect(sections).toEqual([
			{title: 'C', data: [orgs[0]]},
			{title: 'S', data: [orgs[1]]},
		])
	})

	test('a query matching nothing returns no sections', () => {
		let orgs = [makeOrg({name: 'Chess Club'})]

		let sections = filterAndGroupOrgs(orgs, 'nonexistent')

		expect(sections).toEqual([])
	})
})
