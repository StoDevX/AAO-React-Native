import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {setCarletonApiRoot} from '@frogpond/api'
import {QueryClient} from '@tanstack/react-query'

// A Carleton campus test: features must fetch, so the recording answers.
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: true,
	campusFixturesDomain: 'carleton.edu',
	servesBundledFixtures: false,
}))

import {dictionaryOptionsFor} from '../../dictionary/query'
import {contactsOptionsFor} from '../../directory/contacts-query'
import {busRoutesOptionsFor} from '../../transit/bus/query'

let requested: string[] = []

beforeEach(() => {
	requested = []
	setCarletonApiRoot(new URL('https://carleton.example.test/v1/'))
	global.fetch = jest.fn((request: Request) => {
		requested.push(request.url)
		return Promise.resolve(new Response(JSON.stringify({data: []}), {status: 200}))
	}) as unknown as typeof fetch
})

describe.each([
	['dictionary', dictionaryOptionsFor],
	['contacts', contactsOptionsFor],
	['transit/bus', busRoutesOptionsFor],
] as const)('%s in a Carleton campus test', (route, options) => {
	test("fetches Carleton's, which the recording answers, instead of St. Olaf's bundled data", async () => {
		await new QueryClient().query(options('carleton') as Parameters<QueryClient['query']>[0])
		expect(requested).toEqual([`https://carleton.example.test/v1/${route}`])
	})
})
