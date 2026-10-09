import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {registerCampusServer} from '@frogpond/api'
import {QueryClient} from '@tanstack/react-query'

// A Carleton campus test: features must fetch, so the recording answers.
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: true,
	uiTestCampus: 'edu.carleton',
	servesBundledFixtures: false,
}))

import {dictionaryOptionsFor} from '../../dictionary/query'
import {contactsOptionsFor} from '../../directory/contacts-query'
import {busRoutesOptionsFor} from '../../transit/bus/query'
import {otherModesGroupedOptionsFor} from '../../transit/other-modes/query'
import {DEFAULT_CALENDAR_SOURCES} from '../../../redux/parts/settings'

let requested: string[] = []

beforeEach(() => {
	requested = []
	registerCampusServer('edu.carleton', new URL('https://carleton.example.test/v1/'))
	global.fetch = jest.fn((request: Request) => {
		requested.push(request.url)
		return Promise.resolve(new Response(JSON.stringify({data: []}), {status: 200}))
	}) as unknown as typeof fetch
})

describe.each([
	['dictionary', dictionaryOptionsFor],
	['contacts', () => contactsOptionsFor('edu.carleton')],
	['transit/bus', busRoutesOptionsFor],
	['transit/modes', otherModesGroupedOptionsFor],
] as const)('%s in a Carleton campus test', (route, options) => {
	test("fetches Carleton's, which the recording answers, instead of St. Olaf's bundled data", async () => {
		// No garbage collection, whose timer would hold Jest open.
		let client = new QueryClient({defaultOptions: {queries: {gcTime: Infinity, retry: false}}})
		await client.query(options('carleton') as Parameters<QueryClient['query']>[0])
		expect(requested).toEqual([`https://carleton.example.test/v1/${route}`])
	})
})

test("a campus test switches on the campus's own calendars, which its recordings answer", () => {
	expect(DEFAULT_CALENDAR_SOURCES).toEqual(['stolaf', 'presence', 'carleton'])
})
