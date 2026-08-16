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
		jest.useRealTimers()
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

	// This app's `AbortSignal` comes from react-native's `abort-controller`
	// polyfill, which has no `AbortSignal.any`/`AbortSignal.timeout` statics
	// (Node's own `AbortSignal` does, so a test using those would pass under
	// Jest and then never fire on device). This proves the manual
	// controller-plus-timer fallback actually aborts.
	test('an absolute fetch that never resolves is aborted after ten seconds', async () => {
		jest.useFakeTimers()

		let fetchMock = jest.fn(
			(_url: string, init?: {signal?: AbortSignal}) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => {
						reject(new DOMException('The operation was aborted', 'AbortError'))
					})
				}),
		)
		global.fetch = fetchMock as unknown as typeof fetch

		let controller = new AbortController()
		let promise = fetchSourceBody('https://wp.stolaf.edu/hangs', controller.signal, 'News')
		let assertion = expect(promise).rejects.toThrow(/aborted/iu)

		await jest.advanceTimersByTimeAsync(10_000)
		await assertion
	})

	test('unmounting (the caller signal aborting) aborts the fetch without waiting for the timeout', async () => {
		let fetchMock = jest.fn(
			(_url: string, init?: {signal?: AbortSignal}) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => {
						reject(new DOMException('The operation was aborted', 'AbortError'))
					})
				}),
		)
		global.fetch = fetchMock as unknown as typeof fetch

		let controller = new AbortController()
		let promise = fetchSourceBody('https://wp.stolaf.edu/hangs', controller.signal, 'News')
		let assertion = expect(promise).rejects.toThrow(/aborted/iu)

		controller.abort()
		await assertion
	})

	test('a relative href in text format resolves through client as text, not json', async () => {
		let fetchMock = jest.fn((request: Request) => {
			expect(request.url).toBe('https://example.test/news/named/rss-feed')
			return Promise.resolve(new Response('<rss>not json</rss>', {status: 200}))
		})
		global.fetch = fetchMock as unknown as typeof fetch

		let controller = new AbortController()
		let body = await fetchSourceBody('news/named/rss-feed', controller.signal, 'News', 'text')

		expect(body).toBe('<rss>not json</rss>')
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	test('an absolute href in text format does not go through the configured api root', async () => {
		let fetchMock = jest.fn((url: string) => {
			expect(url).toBe('https://content.krlx.org/feed/')
			return new Response('<rss>not json</rss>', {status: 200})
		})
		global.fetch = fetchMock as unknown as typeof fetch

		let controller = new AbortController()
		let body = await fetchSourceBody(
			'https://content.krlx.org/feed/',
			controller.signal,
			'News',
			'text',
		)

		expect(body).toBe('<rss>not json</rss>')
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})
})
