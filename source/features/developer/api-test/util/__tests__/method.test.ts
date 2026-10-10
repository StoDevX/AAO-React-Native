import {describe, expect, test} from '@jest/globals'

import {carriesBody, sendsWithoutAsking} from '../method'

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

describe('carriesBody', () => {
	test('gives a body to the methods that send one', () => {
		for (let method of ['POST', 'PUT', 'PATCH', 'QUERY']) {
			expect(carriesBody(method)).toBe(true)
		}
	})

	test('gives none to a GET, a HEAD or a DELETE', () => {
		for (let method of ['GET', 'HEAD', 'DELETE']) {
			expect(carriesBody(method)).toBe(false)
		}
	})
})
