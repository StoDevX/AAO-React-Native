import {afterEach, expect, test} from '@jest/globals'

import {clientFor, registerCampusServer, setFetchInterceptor} from '../index'

// A campus UI test answers every request from its recordings by setting an
// interceptor; every campus's client has to pass through it. The data sources'
// own fetches are checked in modules/data-sources.
let seen: string[] = []

registerCampusServer('edu.stolaf', new URL('https://stolaf.example.test/v1/'))
registerCampusServer('edu.carleton', new URL('https://carleton.example.test/v1/'))
setFetchInterceptor((request) => {
	seen.push(request.url)
	return Promise.resolve(Response.json({answered: request.url}))
})

afterEach(() => {
	seen = []
})

test("St. Olaf's client asks through it", async () => {
	await expect(clientFor('edu.stolaf').get('contacts').json()).resolves.toEqual({
		answered: 'https://stolaf.example.test/v1/contacts',
	})
	expect(seen).toEqual(['https://stolaf.example.test/v1/contacts'])
})

test("Carleton's client asks through it", async () => {
	await clientFor('edu.carleton').get('dictionary').json()
	expect(seen).toEqual(['https://carleton.example.test/v1/dictionary'])
})
