import {Linking} from 'react-native'
import noop from 'lodash/noop'
import {afterEach, describe, expect, jest, test} from '@jest/globals'

import {canOpenUrl, openUrl} from '../open-url'

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

describe('openUrl', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	test('resolves true once iOS opens a tel: link', async () => {
		jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true)
		jest.spyOn(Linking, 'openURL').mockResolvedValue(true)

		await expect(openUrl('tel:+15072224127')).resolves.toBe(true)
	})

	test('resolves false when nothing can place the call', async () => {
		jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false)
		jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Unable to open URL'))
		jest.spyOn(console, 'warn').mockImplementation(noop)
		jest.spyOn(console, 'error').mockImplementation(noop)

		await expect(openUrl('tel:+15072224127')).resolves.toBe(false)
	})
})
