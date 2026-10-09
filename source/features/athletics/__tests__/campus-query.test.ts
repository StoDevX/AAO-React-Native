import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {QueryClient} from '@tanstack/react-query'

import {installCampusFixtures} from '../../campus/fixtures'
import {useCampusStore} from '../../campus/store'
import {athleticsOptions} from '../query'

let client: QueryClient

beforeEach(() => {
	useCampusStore.setState({campus: 'example.college'})
	registerCampusServer('example.college', new URL('https://example.college.invalid/'))
	installCampusFixtures('example.college', 'serve')
	client = new QueryClient({defaultOptions: {queries: {retry: false}}})
})
afterEach(() => {
	useCampusStore.setState(useCampusStore.getInitialState())
	client.clear()
	setFetchInterceptor(null)
})

// A campus's scores come from its server, as in the app, which a campus's fixtures answer.
describe("a campus's athletics", () => {
	test("are its own teams' games", async () => {
		let {queryKey, queryFn} = athleticsOptions
		let scores = await client.query({queryKey, queryFn})
		expect(new Set(scores.map((score) => score.hometeam))).toEqual(new Set(['Wiki Monkeys']))
	})
})
