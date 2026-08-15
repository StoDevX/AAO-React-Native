import {setApiRoot} from '@frogpond/api'
import {fetchSourceBody, isAbsoluteHref} from '../fetch-source'

describe('isAbsoluteHref', () => {
	test('an absolute href has a scheme', () => {
		expect(isAbsoluteHref('https://wp.stolaf.edu/wp-json/wp/v2/posts')).toBe(true)
	})

	test('a relative href has no scheme', () => {
		expect(isAbsoluteHref('news/named/mess')).toBe(false)
	})
})

describe('fetchSourceBody', () => {
	let originalFetch = global.fetch

	beforeEach(() => {
		setApiRoot(new URL('https://example.test/'))
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	test('a relative href resolves through client, honouring the configured api root', async () => {
		let fetchMock = jest.fn((request: Request) => {
			expect(request.url).toBe('https://example.test/news/named/mess')
			return Promise.resolve(new Response(JSON.stringify({ok: true}), {status: 200}))
		})
		global.fetch = fetchMock as unknown as typeof fetch

		let controller = new AbortController()
		let body = await fetchSourceBody('news/named/mess', controller.signal, 'News')

		expect(body).toEqual({ok: true})
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	test('an absolute href does not go through the configured api root', async () => {
		let fetchMock = jest.fn((url: string) => {
			expect(url).toBe('https://wp.stolaf.edu/wp-json/wp/v2/posts')
			return new Response(JSON.stringify({ok: true}), {status: 200})
		})
		global.fetch = fetchMock as unknown as typeof fetch

		let controller = new AbortController()
		let body = await fetchSourceBody(
			'https://wp.stolaf.edu/wp-json/wp/v2/posts',
			controller.signal,
			'News',
		)

		expect(body).toEqual({ok: true})
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})
})
