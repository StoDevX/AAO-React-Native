import ky from 'ky'
import {SourceFetchError} from '@frogpond/data-sources'
import {QueryClient} from '@tanstack/react-query'

import {describeQueryFailure, watchQueryFailures} from '../query-failures'

// Real ky errors, made by pointing ky at a fetch that fails in each way, so
// the classification is tested against the library rather than a guess at it.
function failWith(fetch: typeof globalThis.fetch, extra: object = {}): Promise<unknown> {
	return ky('https://example.test/data', {retry: 0, fetch, ...extra}).then(
		() => {
			throw new Error('expected the request to fail')
		},
		(error: unknown) => error,
	)
}

const clients: QueryClient[] = []
afterEach(() => {
	for (let client of clients) {
		client.clear()
	}
	clients.length = 0
})

describe('describeQueryFailure', () => {
	it('reports an HTTP failure with its status', async () => {
		let error = await failWith(() => Promise.resolve(new Response('', {status: 503})))

		expect(describeQueryFailure(['news', {page: 2}], error)).toStrictEqual({
			name: 'api.failure',
			attributes: {source: 'news', kind: 'http', status: 503},
		})
	})

	it('reports a source that answered with an error status as an http failure, with its status', () => {
		let error = new SourceFetchError('Olaf Messenger fetch failed: 503', 503)

		expect(describeQueryFailure(['mess', 'feed'], error)).toStrictEqual({
			name: 'api.failure',
			attributes: {source: 'mess', kind: 'http', status: 503},
		})
	})

	it('reports a network failure with no status', async () => {
		let error = await failWith(() => Promise.reject(new TypeError('Network request failed')))

		expect(describeQueryFailure(['menus'], error).attributes).toStrictEqual({
			source: 'menus',
			kind: 'network',
			status: 0,
		})
	})

	it('reports a timeout', async () => {
		let error = await failWith(() => new Promise<Response>(() => undefined), {timeout: 5})

		expect(describeQueryFailure(['directory'], error).attributes.kind).toBe('timeout')
	})

	it('reports anything else as other', () => {
		expect(describeQueryFailure(['news'], new SyntaxError('bad JSON')).attributes).toStrictEqual({
			source: 'news',
			kind: 'other',
			status: 0,
		})
	})

	it('sends unknown when the key does not start with text', () => {
		let failure = describeQueryFailure([{search: 'a person'}], new Error('x'))

		expect(failure.attributes.source).toBe('unknown')
	})
})

describe('watchQueryFailures', () => {
	it('reports a query that fails, once, with only the head of its key', async () => {
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		clients.push(client)
		let report = jest.fn()
		watchQueryFailures(client.getQueryCache(), report)

		await client
			.query({queryKey: ['news', {page: 2}], queryFn: () => Promise.reject(new Error('x'))})
			.catch(() => undefined)

		expect(report).toHaveBeenCalledTimes(1)
		expect(report).toHaveBeenCalledWith({
			name: 'api.failure',
			attributes: {source: 'news', kind: 'other', status: 0},
		})
	})

	it('reports nothing for a query that succeeds', async () => {
		let client = new QueryClient()
		clients.push(client)
		let report = jest.fn()
		watchQueryFailures(client.getQueryCache(), report)

		await client.query({queryKey: ['news'], queryFn: () => Promise.resolve([])})

		expect(report).not.toHaveBeenCalled()
	})

	it('stops reporting once unsubscribed', async () => {
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		clients.push(client)
		let report = jest.fn()
		let stop = watchQueryFailures(client.getQueryCache(), report)

		stop()
		await client
			.query({queryKey: ['news'], queryFn: () => Promise.reject(new Error('x'))})
			.catch(() => undefined)

		expect(report).not.toHaveBeenCalled()
	})
})
