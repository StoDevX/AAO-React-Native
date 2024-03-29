import {describe, expect, test} from '@jest/globals'

import {canOpenUrl} from '../open-url'

describe('canOpenUrl', () => {
	test('opens http:// links', () => {
		expect(canOpenUrl('http://google.com')).toBe(true)
	})
	test('opens https:// links', () => {
		expect(canOpenUrl('https://google.com')).toBe(true)
	})
	test('opens tel: links', () => {
		expect(canOpenUrl('tel:18001234567')).toBe(true)
	})
	test('opens mailto: links', () => {
		expect(canOpenUrl('mailto:allaboutolaf@frogpond.tech')).toBe(true)
	})
	test('does not open about: links', () => {
		expect(canOpenUrl('about:blank')).toBe(false)
		expect(canOpenUrl('about:config')).toBe(false)
	})
	test('does not open data: urls', () => {
		expect(canOpenUrl('data:base64;fab')).toBe(false)
	})
})
