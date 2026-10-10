import {afterEach, beforeEach, expect, jest, test} from '@jest/globals'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {setManifestServer} from '@frogpond/data-sources'
import {InfiniteQueryObserver, QueryClient} from '@tanstack/react-query'

import {installCampusFixtures} from '../../campus/fixtures'
import {useCampusStore} from '../../campus/store'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {CARLETONIAN} from '../../../campuses/edu-carleton/paper'
import {paperQueries} from '../query'

// A campus run, as the Carleton UI tests are: its recordings answer the paper's requests.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

let client: QueryClient

beforeEach(() => {
	useCampusStore.setState({campus: 'edu.carleton'})
	setManifestServer('edu.carleton')
	registerCampusServer('edu.carleton', new URL('https://carleton.example.invalid/'))
	installCampusFixtures('edu.carleton', 'serve')
	client = new QueryClient({defaultOptions: {queries: {retry: false}}})
})
afterEach(() => {
	client.clear()
	appQueryClient.clear()
	setFetchInterceptor(null)
	useCampusStore.setState(useCampusStore.getInitialState())
})

// The recorded first page is a full hundred, so the issue grid's end row asks for a second as soon
// as it is drawn. Its recording ends the list there, rather than failing the Carletonian UI test
// on a request nothing answers.
test("the Carletonian's issues end after the recorded page", async () => {
	let observer = new InfiniteQueryObserver(client, paperQueries(CARLETONIAN).issuesOptions)
	await observer.refetch()
	let first = observer.getCurrentResult()
	expect(first.data?.pages[0]).toHaveLength(100)
	expect(first.hasNextPage).toBe(true)

	let second = await observer.fetchNextPage()
	expect(second.isFetchNextPageError).toBe(false)
	expect(second.data?.pages[1]).toEqual([])
	expect(second.hasNextPage).toBe(false)
})
