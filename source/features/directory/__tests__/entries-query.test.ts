import {afterEach, beforeEach, expect, jest, test} from '@jest/globals'
import {QueryClient, QueryObserver} from '@tanstack/react-query'

import {directoryEntriesOptions} from '../query'

const DIRECTORY = {searchUrl: 'https://directory.example.invalid/'}

let originalFetch = global.fetch
let requested: string[] = []
let client: QueryClient

beforeEach(() => {
	requested = []
	global.fetch = jest.fn((request: Request) => {
		requested.push(request.url)
		return Promise.resolve(new Response(JSON.stringify({results: []}), {status: 200}))
	}) as unknown as typeof fetch
	client = new QueryClient({defaultOptions: {queries: {retry: false}}})
})
afterEach(() => {
	client.clear()
	global.fetch = originalFetch
})

async function settle(query: string): Promise<void> {
	let observer = new QueryObserver(client, directoryEntriesOptions(DIRECTORY, query, 'query'))
	let unsubscribe = observer.subscribe(() => undefined)
	await new Promise((resolve) => setTimeout(resolve, 0))
	await client.getQueryCache().find({queryKey: observer.options.queryKey})?.promise
	unsubscribe()
}

// The landing and the Keep Typing notice show no results, so nothing is asked of the directory
// until there are two letters to search for.
test.each(['', 'a', ' b '])('searches nothing for %p', async (query) => {
	await settle(query)
	expect(requested).toEqual([])
})

test('searches once there are two letters', async () => {
	await settle('ab')
	expect(requested).toEqual(['https://directory.example.invalid/search?format=json&query=ab'])
})
