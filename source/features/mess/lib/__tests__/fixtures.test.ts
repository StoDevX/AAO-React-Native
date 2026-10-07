import {beforeEach, describe, expect, jest, test} from '@jest/globals'

let mockMode = 'live'
jest.mock('@frogpond/launch-arguments', () => ({
	get fixtureMode() {
		return mockMode
	},
}))
const mockFetch =
	jest.fn<(href: string, signal: AbortSignal, label: string, format?: string) => Promise<unknown>>()
jest.mock('@frogpond/data-sources', () => {
	let actual = jest.requireActual<typeof import('@frogpond/data-sources')>('@frogpond/data-sources')
	return {...actual, fetchSourceBody: (...args: Parameters<typeof mockFetch>) => mockFetch(...args)}
})
const mockWrites: string[] = []
jest.mock('expo-file-system', () => ({
	Paths: {document: 'documents'},
	File: jest.fn().mockImplementation(() => ({
		exists: true,
		create: jest.fn(),
		write: (text: string) => mockWrites.push(text),
	})),
}))
jest.mock('../../__fixtures__/mess.json', () => ({
	'json https://x/posts': [{id: 1}],
	'text https://x/page': '<html>',
	'json https://x/posts?page=9': {status: 400},
	'json https://x/posts?page=10': {status: 400, code: 'rest_post_invalid_page_number'},
}))

import {SourceFetchError} from '@frogpond/data-sources'
import {fixtureKey, MissingMessFixture, messFetch} from '../fixtures'

const signal = new AbortController().signal

beforeEach(() => {
	mockFetch.mockReset()
	mockWrites.length = 0
})

describe('messFetch', () => {
	test('live: fetches, and records nothing', async () => {
		mockMode = 'live'
		mockFetch.mockResolvedValue([{id: 2}])
		await expect(messFetch('https://x/posts', signal, 'Mess')).resolves.toEqual([{id: 2}])
		expect(mockWrites).toEqual([])
	})

	test('serve: answers from the fixture by URL and format, never the network', async () => {
		mockMode = 'serve'
		await expect(messFetch('https://x/posts', signal, 'Mess')).resolves.toEqual([{id: 1}])
		await expect(messFetch('https://x/page', signal, 'Mess', 'text')).resolves.toBe('<html>')
		expect(mockFetch).not.toHaveBeenCalled()
	})

	test('serve: a URL with no fixture throws, naming it', async () => {
		mockMode = 'serve'
		await expect(messFetch('https://x/other', signal, 'Mess')).rejects.toThrow(MissingMessFixture)
		await expect(messFetch('https://x/other', signal, 'Mess')).rejects.toThrow(
			'json https://x/other',
		)
		// The same URL in the other format is a different fixture.
		await expect(messFetch('https://x/page', signal, 'Mess')).rejects.toThrow(MissingMessFixture)
	})

	test('serve: a recorded failure fails again with its status', async () => {
		mockMode = 'serve'
		let error = await messFetch('https://x/posts?page=9', signal, 'Mess').catch((e: unknown) => e)
		expect(error).toBeInstanceOf(SourceFetchError)
		expect((error as SourceFetchError).status).toBe(400)
	})

	test('serve: a recorded failure fails again with its WordPress code', async () => {
		mockMode = 'serve'
		let error = await messFetch('https://x/posts?page=10', signal, 'Mess').catch((e: unknown) => e)
		expect(error).toBeInstanceOf(SourceFetchError)
		expect(error).toMatchObject({status: 400, code: 'rest_post_invalid_page_number'})
	})

	test('record: fetches live and appends the answer', async () => {
		mockMode = 'record'
		mockFetch.mockResolvedValue([{id: 3}])
		await expect(messFetch('https://x/posts', signal, 'Mess')).resolves.toEqual([{id: 3}])
		expect(mockWrites.map((line) => JSON.parse(line))).toEqual([
			{href: 'https://x/posts', format: 'json', body: [{id: 3}]},
		])
	})

	test('record: a failed fetch is recorded with its status and still fails', async () => {
		mockMode = 'record'
		mockFetch.mockRejectedValue(
			new SourceFetchError('Mess fetch failed: 400', 400, {code: 'rest_post_invalid_page_number'}),
		)
		await expect(messFetch('https://x/posts?page=9', signal, 'Mess')).rejects.toThrow(
			SourceFetchError,
		)
		expect(JSON.parse(mockWrites[0])).toEqual({
			href: 'https://x/posts?page=9',
			format: 'json',
			status: 400,
			code: 'rest_post_invalid_page_number',
		})
	})
})

test('fixtureKey puts the format first', () => {
	expect(fixtureKey('text', 'https://x/page')).toBe('text https://x/page')
})
