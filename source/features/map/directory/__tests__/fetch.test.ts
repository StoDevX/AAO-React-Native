import {describe, expect, jest, test} from '@jest/globals'

import {fetchDirectories} from '../fetch'

jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

let mockGet = jest.fn()
let mockClientFor = jest.fn((_id: string) => ({get: (...args: Array<unknown>) => mockGet(...args)}))
jest.mock('@frogpond/api', () => ({clientFor: (id: string) => mockClientFor(id)}))

describe('fetchDirectories', () => {
	test("reads the server's copy", async () => {
		let served = [{building: 'toh', floors: []}]
		mockGet.mockReturnValueOnce({json: () => Promise.resolve({data: served})})

		await expect(fetchDirectories('edu.stolaf', new AbortController().signal)).resolves.toEqual(
			served,
		)
		expect(mockGet).toHaveBeenLastCalledWith('spaces/directory', expect.anything())
		expect(mockClientFor).toHaveBeenLastCalledWith('edu.stolaf')
	})

	test('fails when the server fails', async () => {
		mockGet.mockReturnValueOnce({json: () => Promise.reject(new Error('HTTP 404'))})

		await expect(fetchDirectories('edu.stolaf', new AbortController().signal)).rejects.toThrow(
			'HTTP 404',
		)
	})
})
