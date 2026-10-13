import {afterEach, beforeEach, expect, test} from '@jest/globals'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {setManifestServer} from '@frogpond/data-sources'
import {QueryClient} from '@tanstack/react-query'

import {installCampusFixtures} from '../../campus/fixtures'
import {useCampusStore} from '../../campus/store'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {mapCategoriesOptions} from '../category-groups-query'

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

// The manifest names Wiki Monkeys' categories by a path on Wiki Monkeys' server, not the
// manifest's, so the building picker's grid has groups to show.
test("a campus's map categories come from its own server", async () => {
	let table = await client.query({...mapCategoriesOptions, retry: false})
	expect(Object.keys(table ?? {}).length).toBeGreaterThan(0)
})
