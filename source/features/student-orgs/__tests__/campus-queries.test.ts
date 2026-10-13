import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {setManifestServer} from '@frogpond/data-sources'
import {QueryClient} from '@tanstack/react-query'

import {installCampusFixtures} from '../../campus/fixtures'
import {useCampusStore} from '../../campus/store'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {categoryMembershipsOptions} from '../category-memberships-query'
import {orgCategoryIconsOptions} from '../category-icons-query'
import {studentOrgsOptions} from '../query'
import {filterAndGroupOrgs} from '../search'

let client: QueryClient

beforeEach(() => {
	useCampusStore.setState({campus: 'example.college'})
	// The manifest comes from St. Olaf's server, as in the app; Wiki Monkeys' fixtures answer it.
	setManifestServer('edu.stolaf')
	registerCampusServer('edu.stolaf', new URL('https://stolaf.example.invalid/'))
	registerCampusServer('example.college', new URL('https://example.college.invalid/'))
	installCampusFixtures('example.college', 'serve')
	client = new QueryClient({defaultOptions: {queries: {retry: false}}})
})
afterEach(() => {
	useCampusStore.setState(useCampusStore.getInitialState())
	client.clear()
	// The manifest is cached on the app's own client, whose collection timer would hold Jest open.
	appQueryClient.clear()
	setFetchInterceptor(null)
})

function resultCount(orgs: Parameters<typeof filterAndGroupOrgs>[0], query: string): number {
	return filterAndGroupOrgs(orgs, query).reduce((sum, section) => sum + section.data.length, 0)
}

// UI tests read a campus's student orgs from its server, as the app does, which a campus's
// fixtures answer; no bundled copy stands in for them.
describe("a campus's student orgs", () => {
	test("run the first search's results several screens long, so the UI test has to scroll", async () => {
		let orgs = await client.query(studentOrgsOptions)
		expect(orgs[0]?.name).toBe('Alpine Club')
		expect(resultCount(orgs, 'a')).toBeGreaterThanOrEqual(60)
	})

	test('list the Alpine Club first when the search is refined', async () => {
		let orgs = await client.query(studentOrgsOptions)
		expect(filterAndGroupOrgs(orgs, 'an')[0]?.data[0]?.name).toBe('Alpine Club')
	})

	test('come in the categories the landing lists, each with its own icon', async () => {
		let memberships = await client.query(categoryMembershipsOptions)
		let icons = await client.query(orgCategoryIconsOptions)
		expect(memberships.map((each) => each.name)).toContain('Club Sports - Recreational')
		expect(icons.map((each) => each.name).toSorted()).toEqual(
			memberships.map((each) => each.name).toSorted(),
		)
	})
})
