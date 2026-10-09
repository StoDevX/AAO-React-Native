import {expect, test} from '@jest/globals'
import {setFetchInterceptor} from '@frogpond/api'

import {fetchSourceBody} from '../fetch-source'

// A campus UI test answers every request from its recordings by setting an
// interceptor, so a source on another site, such as a paper's, has to pass
// through it too.
test("a source on another site asks through the app's interceptor", async () => {
	let seen: string[] = []
	setFetchInterceptor((request) => {
		seen.push(request.url)
		return Promise.resolve(Response.json({answered: request.url}))
	})
	let href = 'https://thecarletonian.com/wp-json/wp/v2/posts?per_page=50'
	await fetchSourceBody(href, new AbortController().signal, 'Paper', 'json')
	expect(seen).toEqual([href])
})
