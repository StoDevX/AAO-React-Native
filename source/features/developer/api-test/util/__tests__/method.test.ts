import {describe, expect, test} from '@jest/globals'
import * as c from '@frogpond/colors'

import {methodColor, sendsWithoutAsking} from '../method'

describe('methodColor', () => {
	test('colours each common method by what it does', () => {
		expect(methodColor('GET')).toBe(c.systemBlue)
		expect(methodColor('POST')).toBe(c.systemGreen)
		expect(methodColor('DELETE')).toBe(c.systemRed)
		expect(methodColor('QUERY')).toBe(c.systemIndigo)
	})

	test('gives any other method one shared colour', () => {
		expect(methodColor('PATCH')).toBe(c.systemOrange)
		expect(methodColor('PUT')).toBe(c.systemOrange)
	})
})

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
