import {describe, expect, test} from '@jest/globals'

import {isErrorStatus, isImageType, statusLine} from '../response'

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

describe('isImageType', () => {
	test('counts any image type, whatever follows it', () => {
		expect(isImageType('image/webp')).toBe(true)
		expect(isImageType('image/png; charset=binary')).toBe(true)
		expect(isImageType('IMAGE/JPEG')).toBe(true)
	})

	test('does not count text, JSON or a missing type', () => {
		expect(isImageType('application/json; charset=utf-8')).toBe(false)
		expect(isImageType('text/plain')).toBe(false)
		expect(isImageType('')).toBe(false)
	})
})
