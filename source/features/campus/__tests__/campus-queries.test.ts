import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {registerCampusServer} from '@frogpond/api'
import {QueryClient} from '@tanstack/react-query'

import {dictionaryOptionsFor} from '../../dictionary/query'
import {contactKeys, contactsOptionsFor} from '../../directory/contacts-query'
import {busRoutesOptionsFor} from '../../transit/bus/query'
import {otherModesGroupedOptionsFor} from '../../transit/other-modes/query'
import type {Campus} from '../store'

/** Contacts take a campus id now; the other three move to theirs in Task 5. */
const contactsFor = (campus: Campus) =>
	contactsOptionsFor(campus === 'carleton' ? 'edu.carleton' : 'edu.stolaf')

// Jest's setup runs every test as a UI test, where these queries read the bundled data and fetch
// nothing; what is under test here is the fetch.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

/** Each campus-aware query, by the route it reads on either campus's server. */
const QUERIES = [
	{route: 'dictionary', options: dictionaryOptionsFor},
	{route: 'contacts', options: contactsFor},
	{route: 'transit/bus', options: busRoutesOptionsFor},
	{route: 'transit/modes', options: otherModesGroupedOptionsFor},
] as const

let originalFetch = global.fetch
let requested: string[] = []

beforeEach(() => {
	requested = []
	registerCampusServer('edu.stolaf', new URL('https://stolaf.example.test/v1/'))
	registerCampusServer('edu.carleton', new URL('https://carleton.example.test/v1/'))
	global.fetch = jest.fn((request: Request) => {
		requested.push(request.url)
		return Promise.resolve(new Response(JSON.stringify({data: []}), {status: 200}))
	}) as unknown as typeof fetch
})

afterEach(() => {
	global.fetch = originalFetch
})

describe.each(QUERIES)('$route', ({route, options}) => {
	test.each<[Campus, string]>([
		['stolaf', 'https://stolaf.example.test/v1/'],
		['carleton', 'https://carleton.example.test/v1/'],
	])("reads %s's from its own server", async (campus, root) => {
		// No garbage collection, whose timer would hold Jest open.
		let client = new QueryClient({defaultOptions: {queries: {gcTime: Infinity, retry: false}}})
		// The options' types differ per query; each is fetched only for its request.
		await client.query(options(campus) as Parameters<typeof client.query>[0])
		expect(requested).toEqual([`${root}${route}`])
	})

	test("keeps each campus's data under a key of its own", () => {
		expect(options('carleton').queryKey).not.toEqual(options('stolaf').queryKey)
	})
})

describe('contacts', () => {
	test('are keyed by the campus id', () => {
		expect(contactKeys.forCampus('edu.stolaf')).toEqual(['edu.stolaf', 'contacts'])
		expect(contactsOptionsFor('edu.carleton').queryKey).toEqual(['edu.carleton', 'contacts'])
	})
})
