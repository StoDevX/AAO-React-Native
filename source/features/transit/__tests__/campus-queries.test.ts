import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {QueryClient} from '@tanstack/react-query'

import {installCampusFixtures} from '../../campus/fixtures'
import {busRoutesOptionsFor} from '../bus/query'
import {otherModesGroupedOptionsFor} from '../other-modes/query'

let client: QueryClient

beforeEach(() => {
	registerCampusServer('example.college', new URL('https://example.college.invalid/'))
	installCampusFixtures('example.college', 'serve')
	client = new QueryClient({defaultOptions: {queries: {retry: false}}})
})
afterEach(() => {
	client.clear()
	setFetchInterceptor(null)
})

// UI tests read a campus's transit from its server, as the app does, which a
// campus's fixtures answer; no bundled copy stands in for it.
describe("a campus's transit", () => {
	test('lists its own bus lines', async () => {
		let lines = await client.fetchQuery(busRoutesOptionsFor('example.college'))
		expect(lines.map((line) => line.line)).toEqual(['Switchback Shuttle'])
	})

	test('lists its own other ways to travel', async () => {
		let {queryKey, queryFn} = otherModesGroupedOptionsFor('example.college')
		let modes = await client.fetchQuery({queryKey, queryFn})
		expect(modes.map((mode) => mode.name)).toContain('Valley Bikes')
	})
})
