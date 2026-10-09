import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {QueryClient} from '@tanstack/react-query'

import {installCampusFixtures} from '../../campus/fixtures'
import {dictionaryOptionsFor} from '../query'

beforeEach(() => {
	registerCampusServer('example.college', new URL('https://example.college.invalid/'))
	installCampusFixtures('example.college', 'serve')
})
afterEach(() => setFetchInterceptor(null))

describe('dictionaryOptionsFor', () => {
	// UI tests read a campus's dictionary from its server, as the app does,
	// which a campus's fixtures answer; no bundled copy stands in for it.
	test("reads the campus's own dictionary from its server", async () => {
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		let words = await client.query(dictionaryOptionsFor('example.college'))
		client.clear()
		let names = words.map((word) => word.word)
		expect(names).toContain('Avalanche Hour')
		expect(names).not.toContain('AAC')
	})
})
