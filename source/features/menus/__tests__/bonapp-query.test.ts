import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient} from '@tanstack/react-query'

import {client} from '@frogpond/api'

import {bonAppCafeOptions, bonAppMenuOptions} from '../query'

jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

jest.mock('@frogpond/api', () => ({
	client: {get: jest.fn(() => ({json: () => Promise.resolve({})}))},
}))

const mockGet = client.get as unknown as jest.Mock

/** A client that schedules no garbage collection, which would hold Jest open. */
function newClient() {
	return new QueryClient({defaultOptions: {queries: {gcTime: Infinity, retry: false}}})
}

beforeEach(() => {
	mockGet.mockClear()
})

describe('BonApp queries for a cafe named by id', () => {
	// ccc-server answers `food/menu/<id>` with a 400 unless the id is also in
	// the query string, which is the only place it reads it from.
	test('asks for the menu with the id in the query string', async () => {
		await newClient().query(bonAppMenuOptions({id: '261'}, '2026-09-22'))

		expect(mockGet).toHaveBeenCalledWith('food/menu/261?cafeId=261', expect.anything())
	})

	test('asks for the cafe with the id in the query string', async () => {
		await newClient().query(bonAppCafeOptions({id: '261'}, '2026-09-22'))

		expect(mockGet).toHaveBeenCalledWith('food/cafe/261?cafeId=261', expect.anything())
	})

	test('asks for a named cafe by its name', async () => {
		await newClient().query(bonAppMenuOptions('stav-hall', '2026-09-22'))

		expect(mockGet).toHaveBeenCalledWith('food/named/menu/stav-hall', expect.anything())
	})
})
