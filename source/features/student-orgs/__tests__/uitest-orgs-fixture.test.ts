import {describe, expect, test} from '@jest/globals'

import {filterAndGroupOrgs} from '../search'
import type {StudentOrgType} from '../types'
import fixture from '../fixtures/uitest-orgs.json'

/// What `testRefiningASearchFromFarDownTheResultsStartsAtTheTop` needs from
/// the org list it is served: a re-recorded fixture too short to scroll would
/// let that test pass without testing anything.
const orgs = fixture as StudentOrgType[]

function resultCount(query: string): number {
	return filterAndGroupOrgs(orgs, query).reduce((sum, section) => sum + section.data.length, 0)
}

describe('the Student Orgs UI-test fixture', () => {
	test("runs the first search's results several screens long, so the test has to scroll", () => {
		expect(resultCount('a')).toBeGreaterThanOrEqual(60)
	})

	test('still finds something for the refined search', () => {
		expect(resultCount('an')).toBeGreaterThan(0)
	})
})
