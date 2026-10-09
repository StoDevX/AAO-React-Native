import {describe, expect, test} from '@jest/globals'
import * as c from '@frogpond/colors'

import {isSafeMethod, methodColor} from '../method'

describe('methodColor', () => {
	test('colours each common method by what it does', () => {
		expect(methodColor('GET')).toBe(c.systemBlue)
		expect(methodColor('POST')).toBe(c.systemGreen)
		expect(methodColor('DELETE')).toBe(c.systemRed)
	})

	test('gives any other method one shared colour', () => {
		expect(methodColor('PATCH')).toBe(c.systemOrange)
		expect(methodColor('PUT')).toBe(c.systemOrange)
	})
})

describe('isSafeMethod', () => {
	test('lets a GET go without asking', () => {
		expect(isSafeMethod('GET')).toBe(true)
	})

	test('asks before anything that can change the server', () => {
		expect(isSafeMethod('POST')).toBe(false)
		expect(isSafeMethod('DELETE')).toBe(false)
	})
})
