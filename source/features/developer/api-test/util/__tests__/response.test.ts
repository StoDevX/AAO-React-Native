import {describe, expect, test} from '@jest/globals'

import {bodyKind, isErrorStatus, statusLine} from '../response'

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

describe('bodyKind', () => {
	test('shows any image type as an image', () => {
		expect(bodyKind('image/webp')).toBe('image')
		expect(bodyKind('IMAGE/JPEG')).toBe('image')
	})

	test('shows text, JSON, XML and script as text, with or without parameters', () => {
		expect(bodyKind('text/plain')).toBe('text')
		expect(bodyKind('text/html; charset=utf-8')).toBe('text')
		expect(bodyKind('application/json; charset=utf-8')).toBe('text')
		expect(bodyKind('application/problem+json')).toBe('text')
		expect(bodyKind('application/rss+xml')).toBe('text')
		expect(bodyKind('application/xml')).toBe('text')
		expect(bodyKind('application/javascript')).toBe('text')
	})

	test('reads a body with no type as text, as a bare 204 or a plain server sends', () => {
		expect(bodyKind('')).toBe('text')
	})

	test('leaves anything else undecoded, as a database or an archive', () => {
		expect(bodyKind('application/octet-stream')).toBe('binary')
		expect(bodyKind('application/vnd.sqlite3')).toBe('binary')
		expect(bodyKind('application/zip')).toBe('binary')
	})
})
