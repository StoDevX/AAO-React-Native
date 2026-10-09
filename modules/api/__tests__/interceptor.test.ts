import {afterEach, expect, test} from '@jest/globals'

import {
	carletonClient,
	setApiRoot,
	setCarletonApiRoot,
	setFetchInterceptor,
	stolafClient,
} from '../index'

// A campus UI test answers every request from its recordings by setting an
// interceptor; both clients have to pass through it. The data sources' own
// fetches are checked in modules/data-sources.
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
