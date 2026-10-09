import {describe, expect, test} from '@jest/globals'

import {sendsWithoutAsking} from '../method'

describe('sendsWithoutAsking', () => {
	test('lets a GET or a POST go without asking', () => {
		expect(sendsWithoutAsking('GET')).toBe(true)
		expect(sendsWithoutAsking('POST')).toBe(true)
	})

	test('asks before a method meant to change what the server holds', () => {
		expect(sendsWithoutAsking('DELETE')).toBe(false)
		expect(sendsWithoutAsking('PUT')).toBe(false)
		expect(sendsWithoutAsking('PATCH')).toBe(false)
	})
})
