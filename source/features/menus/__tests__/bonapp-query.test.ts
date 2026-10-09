import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient} from '@tanstack/react-query'

import {bonAppCafeOptions, bonAppMenuOptions} from '../query'

jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

const mockGet = jest.fn((..._args: Array<unknown>) => ({json: () => Promise.resolve({})}))
const mockClientFor = jest.fn((_id: string) => ({get: mockGet}))
jest.mock('@frogpond/api', () => ({clientFor: (id: string) => mockClientFor(id)}))

/** A client that schedules no garbage collection, which would hold Jest open. */
function newClient() {
	return new QueryClient({defaultOptions: {queries: {gcTime: Infinity, retry: false}}})
}

beforeEach(() => {
	mockGet.mockClear()
	mockClientFor.mockClear()
})

describe('BonApp queries for a cafe named by id', () => {
	// ccc-server answers `food/menu/<id>` with a 400 unless the id is also in
	// the query string, which is the only place it reads it from.
	test('asks for the menu with the id in the query string', async () => {
		await newClient().query(bonAppMenuOptions('edu.stolaf', {id: '261'}, '2026-09-22'))

		expect(mockGet).toHaveBeenCalledWith('food/menu/261?cafeId=261', expect.anything())
	})

	test('asks for the cafe with the id in the query string', async () => {
		await newClient().query(bonAppCafeOptions('edu.stolaf', {id: '261'}, '2026-09-22'))

		expect(mockGet).toHaveBeenCalledWith('food/cafe/261?cafeId=261', expect.anything())
	})

	test('asks for a named cafe by its name', async () => {
		await newClient().query(bonAppMenuOptions('edu.stolaf', 'stav-hall', '2026-09-22'))

		expect(mockGet).toHaveBeenCalledWith('food/named/menu/stav-hall', expect.anything())
	})
})

describe('BonApp queries by server', () => {
	test("ask a Carleton hall's menu of the server they are given", async () => {
		await newClient().query(bonAppMenuOptions('edu.carleton', 'burton', '2026-09-22'))

		expect(mockClientFor).toHaveBeenLastCalledWith('edu.carleton')
		expect(mockGet).toHaveBeenCalledWith('food/named/menu/burton', expect.anything())
	})

	test("keep each server's menus apart", () => {
		expect(bonAppMenuOptions('edu.carleton', 'burton', '2026-09-22').queryKey).not.toEqual(
			bonAppMenuOptions('edu.stolaf', 'burton', '2026-09-22').queryKey,
		)
	})
})
