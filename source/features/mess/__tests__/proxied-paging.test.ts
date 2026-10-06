import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {setApiRoot} from '@frogpond/api'
import {fetchManifest, ID_PROPERTY, REL_NEWS, type Jrd} from '@frogpond/data-sources'
import {queryClient} from '../../../init/tanstack-query'
import {messFeedOptions} from '../query'
import type {MessStory} from '../types'

// Only the manifest is stubbed: the fetch, ky's client and its errors, SourceFetchError and the
// paging all run for real, against a network that answers like ccc-server's copy of the paper.
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>

const PROXIED = {
	subject: 'https://stolaf.edu',
	links: [
		{
			rel: REL_NEWS,
			href: 'news/mess/wp/v2/posts?per_page=50&_embed=true',
			type: 'application/vnd.wordpress.v2.posts+json',
			properties: {[ID_PROPERTY]: 'mess'},
		},
	],
} as unknown as Jrd

/** A WordPress error, as ccc-server passes it on. */
const wordpressError = (code: string) =>
	new Response(JSON.stringify({code, data: {status: 400}}), {
		status: 400,
		headers: {'content-type': 'application/json; charset=UTF-8'},
	})

/** Answers the category tree with none, and a feed page with `page()`. */
function serve(page: () => Response): void {
	global.fetch = jest.fn((input: Request | string) => {
		let url = input instanceof Request ? input.url : input
		if (url.includes('/categories')) {
			return Promise.resolve(new Response('[]', {headers: {'content-type': 'application/json'}}))
		}
		return Promise.resolve(page())
	}) as unknown as typeof fetch
}

/** One page of the feed, fetched as the infinite query fetches it. */
function feedPage(pageParam: number): Promise<MessStory[]> {
	let queryFn = messFeedOptions.queryFn as unknown as (context: {
		signal: AbortSignal
		pageParam: number
	}) => Promise<MessStory[]>
	return queryFn({signal: new AbortController().signal, pageParam})
}

const originalFetch = global.fetch

beforeEach(() => {
	setApiRoot(new URL('https://ccc.example.test/v1/'))
	mockManifest.mockResolvedValue(PROXIED)
})

afterEach(() => {
	global.fetch = originalFetch
	queryClient.clear()
	jest.clearAllMocks()
})

describe('the feed through ccc-server', () => {
	test("ends at WordPress's 400 for a page past the last", async () => {
		serve(() => wordpressError('rest_post_invalid_page_number'))

		await expect(feedPage(7)).resolves.toStrictEqual([])
	})

	test('fails a later page on a 400 for anything else', async () => {
		serve(() => wordpressError('rest_invalid_param'))

		await expect(feedPage(7)).rejects.toMatchObject({status: 400, code: 'rest_invalid_param'})
	})
})
