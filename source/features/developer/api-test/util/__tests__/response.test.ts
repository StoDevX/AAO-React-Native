import {describe, expect, test} from '@jest/globals'

import {isErrorStatus, statusLine} from '../response'

describe('statusLine', () => {
	test('reads the status with its reason', () => {
		expect(statusLine({status: 404, statusText: 'Not Found'})).toBe('404 Not Found')
	})

	test('reads the bare status when the server sent no reason', () => {
		expect(statusLine({status: 204, statusText: ''})).toBe('204')
	})
})

describe('isErrorStatus', () => {
	test('counts client and server errors', () => {
		expect(isErrorStatus(404)).toBe(true)
		expect(isErrorStatus(500)).toBe(true)
	})

	test('does not count a success or a redirect', () => {
		expect(isErrorStatus(200)).toBe(false)
		expect(isErrorStatus(204)).toBe(false)
		expect(isErrorStatus(304)).toBe(false)
	})
})
