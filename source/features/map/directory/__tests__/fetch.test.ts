import {describe, expect, jest, test} from '@jest/globals'
import {onlineManager, QueryClient} from '@tanstack/react-query'

import bundled from '../../../../../docs/building-directory.json'
import {cardDirectoryOptions} from '../../card-queries'
import {fetchDirectories} from '../fetch'

jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

let mockGet = jest.fn()
jest.mock('@frogpond/api', () => ({client: {get: (...args: Array<unknown>) => mockGet(...args)}}))

const bundledData = (bundled as {data: Array<unknown>}).data

describe('fetchDirectories', () => {
	test("reads the server's copy", async () => {
		let served = [{building: 'toh', floors: []}]
		mockGet.mockReturnValueOnce({json: () => Promise.resolve({data: served})})

		await expect(fetchDirectories(new AbortController().signal)).resolves.toEqual(served)
		expect(mockGet).toHaveBeenLastCalledWith('spaces/directory', expect.anything())
	})

	// The route is new; until ccc-server ships it, and whenever it is down, the
	// card keeps the copy the app was built with.
	test('falls back to the bundled copy when the server fails', async () => {
		mockGet.mockReturnValueOnce({json: () => Promise.reject(new Error('HTTP 404'))})

		await expect(fetchDirectories(new AbortController().signal)).resolves.toEqual(bundledData)
	})
})

// React Query pauses an online-only query while the phone is offline, so the
// fetch -- and its fallback -- would never run.
describe('cardDirectoryOptions', () => {
	test('reads the bundled copy while offline', async () => {
		onlineManager.setOnline(false)
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		try {
			mockGet.mockReturnValueOnce({
				json: () => Promise.reject(new TypeError('Network request failed')),
			})
			let result = await Promise.race([
				client.query(cardDirectoryOptions('stolaf')),
				new Promise((resolve) => setTimeout(() => resolve('paused'), 50)),
			])
			expect(result).toEqual(bundledData)
		} finally {
			client.clear()
			onlineManager.setOnline(true)
		}
	})
})
