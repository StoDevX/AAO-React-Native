import {isHTTPError, setApiRoot, setCarletonApiRoot} from '@frogpond/api'
import {fetchSourceBody, isAbsoluteHref, SourceFetchError} from '../fetch-source'

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

	test('a relative href resolves through stolafClient, honouring the configured api root', async () => {
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

	test("a Carleton source's relative href resolves against Carleton's server", async () => {
		setCarletonApiRoot(new URL('https://carleton.example.test/v1/'))
		let fetchMock = jest.fn((request: Request) => {
			expect(request.url).toBe('https://carleton.example.test/v1/calendar/named/sumo-schedule')
			return Promise.resolve(new Response(JSON.stringify([]), {status: 200}))
		})
		global.fetch = fetchMock as unknown as typeof fetch

		let controller = new AbortController()
		let body = await fetchSourceBody(
			'calendar/named/sumo-schedule',
			controller.signal,
			'Calendar',
			'json',
			'carleton',
		)

		expect(body).toEqual([])
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

	test('an absolute href answered with an error status throws, carrying the status', async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve(new Response('{"code":"rest_post_invalid_page_number"}', {status: 400})),
		) as unknown as typeof fetch

		let failure = fetchSourceBody(
			'https://olafmessenger.com/wp-json/wp/v2/posts?page=54',
			new AbortController().signal,
			'Olaf Messenger issues',
		)

		await expect(failure).rejects.toBeInstanceOf(SourceFetchError)
		await expect(failure).rejects.toMatchObject({
			status: 400,
			message: 'Olaf Messenger issues fetch failed: 400',
		})
	})

	describe.each([
		['an absolute', 'https://olafmessenger.com/wp-json/wp/v2/posts?page=54'],
		['a relative', 'news/mess/wp/v2/posts?page=54'],
	])('%s href answered with a WordPress error', (_kind, href) => {
		test('carries the code WordPress named', async () => {
			global.fetch = jest.fn(() =>
				Promise.resolve(
					new Response('{"code":"rest_post_invalid_page_number","data":{"status":400}}', {
						status: 400,
						headers: {'content-type': 'application/json'},
					}),
				),
			) as unknown as typeof fetch

			let failure = fetchSourceBody(href, new AbortController().signal, 'Olaf Messenger')

			await expect(failure).rejects.toMatchObject({
				status: 400,
				code: 'rest_post_invalid_page_number',
			})
		})

		test('carries no code for a body that names none', async () => {
			global.fetch = jest.fn(() =>
				Promise.resolve(new Response('<html>no</html>', {status: 400})),
			) as unknown as typeof fetch

			let failure = fetchSourceBody(href, new AbortController().signal, 'Olaf Messenger')

			await expect(failure).rejects.toMatchObject({status: 400, code: undefined})
		})
	})

	test("keeps ky's error as a relative failure's cause", async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve(new Response('', {status: 502})),
		) as unknown as typeof fetch

		let error: unknown = await fetchSourceBody(
			'calendar/named/ksto-schedule',
			new AbortController().signal,
			'Calendar',
		).catch((caught: unknown) => caught)

		expect(error).toBeInstanceOf(SourceFetchError)
		expect(isHTTPError((error as Error).cause)).toBe(true)
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

	test('a relative href in text format resolves through stolafClient as text, not json', async () => {
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
