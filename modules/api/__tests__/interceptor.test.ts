import {afterEach, expect, test} from '@jest/globals'
import {fetchSourceBody} from '@frogpond/data-sources'

import {
	carletonClient,
	setApiRoot,
	setCarletonApiRoot,
	setFetchInterceptor,
	stolafClient,
} from '../index'

// A campus UI test answers every request from its recordings by setting an
// interceptor; each way the app fetches has to pass through it.
let seen: string[] = []

setApiRoot(new URL('https://stolaf.example.test/v1/'))
setCarletonApiRoot(new URL('https://carleton.example.test/v1/'))
setFetchInterceptor((request) => {
	seen.push(request.url)
	return Promise.resolve(Response.json({answered: request.url}))
})

afterEach(() => {
	seen = []
})

test('the St. Olaf client asks through it', async () => {
	await expect(stolafClient.get('contacts').json()).resolves.toEqual({
		answered: 'https://stolaf.example.test/v1/contacts',
	})
	expect(seen).toEqual(['https://stolaf.example.test/v1/contacts'])
})

test('the Carleton client asks through it', async () => {
	await carletonClient.get('dictionary').json()
	expect(seen).toEqual(['https://carleton.example.test/v1/dictionary'])
})

test("a data source on another site asks through it, as a paper's does", async () => {
	let href = 'https://thecarletonian.com/wp-json/wp/v2/posts?per_page=50'
	await fetchSourceBody(href, new AbortController().signal, 'Paper', 'json')
	expect(seen).toEqual([href])
})
