import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient} from '@tanstack/react-query'
import {HTTPError} from 'ky'

import {client} from '@frogpond/api'

import {orgDetailOptions} from '../query'

jest.mock('@frogpond/api', () => ({
	client: {get: jest.fn()},
}))

const mockGet = client.get as unknown as jest.Mock

/** A client that schedules no garbage collection, which would hold Jest open. */
function newClient() {
	return new QueryClient({defaultOptions: {queries: {gcTime: Infinity}}})
}

function answering(status: number) {
	let request = new Request('https://stolaf.frogpond.tech/v1/orgs/uri/agape')
	let error = new HTTPError(new Response(null, {status}), request, {} as never)
	return {json: () => Promise.reject(error)}
}

beforeEach(() => {
	mockGet.mockReset()
})

describe("an org's own record", () => {
	test('is asked for by its uri', async () => {
		mockGet.mockReturnValue({json: () => Promise.resolve({organizationUri: 'agape'})})

		await newClient().query(orgDetailOptions('agape'))

		expect(mockGet).toHaveBeenCalledWith('orgs/uri/agape', expect.anything())
	})

	test('is null from a server without the route, or without the org', async () => {
		mockGet.mockReturnValue(answering(404))

		await expect(newClient().query(orgDetailOptions('agape'))).resolves.toBeNull()
	})

	test('fails on any other error, so it is reported', async () => {
		mockGet.mockReturnValue(answering(500))

		await expect(newClient().query(orgDetailOptions('agape'))).rejects.toBeInstanceOf(HTTPError)
	})

	test("is not filed under the org list's key, so its failures are its own", () => {
		expect(orgDetailOptions('agape').queryKey[0]).toBe('org-detail')
	})
})
