import {afterEach, beforeEach, expect, test} from '@jest/globals'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {setManifestServer} from '@frogpond/data-sources'
import {QueryClient} from '@tanstack/react-query'

import {installCampusFixtures} from '../../campus/fixtures'
import {useCampusStore} from '../../campus/store'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {searchLinksOptions} from '../query'

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
	client.clear()
	// The manifest is cached on the app's own client, whose collection timer would hold Jest open.
	appQueryClient.clear()
	setFetchInterceptor(null)
	useCampusStore.setState({campus: 'edu.stolaf'})
})

// The manifest names Wiki Monkeys' A–Z by a path on Wiki Monkeys' server, not the manifest's.
// Wiki Monkeys has no A–Z recorded yet, so the request it makes is read from the miss.
test("a campus's A–Z is asked of its own server", async () => {
	await expect(client.query(searchLinksOptions)).rejects.toThrow(
		'"GET {server:example.college}/a-to-z/named/wiki-monkeys"',
	)
})
