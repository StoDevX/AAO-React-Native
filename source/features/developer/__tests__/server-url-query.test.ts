import {expect, test} from '@jest/globals'
import {QueryClient} from '@tanstack/react-query'

import {CAMPUSES} from '../../../campuses'
import * as storage from '../../../lib/storage'
import {serverUrlOptions} from '../query'

test("keeps each campus's saved server under a query key of its own", () => {
	let keys = CAMPUSES.map((campus) =>
		JSON.stringify(serverUrlOptions(campus.api.storageKey).queryKey),
	)
	expect(new Set(keys).size).toBe(CAMPUSES.length)
})

test('reads the address saved under the key it is given', async () => {
	await storage.setServerAddressFor(
		'settings:server-address:edu.stolaf',
		'https://dev.example.test/v1',
	)
	// No garbage collection, whose timer would hold Jest open.
	let client = new QueryClient({defaultOptions: {queries: {gcTime: Infinity}}})
	await expect(client.query(serverUrlOptions('settings:server-address:edu.stolaf'))).resolves.toBe(
		'https://dev.example.test/v1/',
	)
})
