import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'

import * as storage from '../../../source/lib/storage'
import {canOpenUrl, openUrl} from '../open-url'

// Both are native, with nothing to bind to under Jest. What is under test is which of them
// `openUrl` hands a link to, which is decided in JavaScript.
jest.mock('expo-web-browser', () => ({
	openBrowserAsync: jest.fn(() => Promise.resolve({type: 'opened'})),
	WebBrowserPresentationStyle: {PAGE_SHEET: 'pageSheet'},
}))
jest.mock('../../../source/lib/storage', () => ({
	getInAppLinkPreference: jest.fn(() => Promise.resolve(true)),
}))

describe('openUrl, with links set to open in the app', () => {
	let openURL: jest.SpiedFunction<typeof Linking.openURL>

	beforeEach(() => {
		jest.mocked(WebBrowser.openBrowserAsync).mockClear()
		openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
	})

	test('opens a web page in the in-app browser', async () => {
		await openUrl('https://x.test/')
		expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://x.test/', expect.anything())
		expect(openURL).not.toHaveBeenCalled()
	})

	test('lowercases an uppercase web scheme, which the in-app browser otherwise refuses', async () => {
		await openUrl('HTTP://x.test/A')
		expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('http://x.test/A', expect.anything())
	})

	test.each(['mailto:a@x.test', 'tel:5555550100', 'sms:5555550100', 'webcal://x.test/c.ics'])(
		'hands %s to iOS, since the in-app browser opens only web pages',
		async (url) => {
			await openUrl(url)
			expect(openURL).toHaveBeenCalledWith(url)
			expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled()
		},
	)

	test('opens a web page with iOS when links are set to open outside the app', async () => {
		jest.mocked(storage.getInAppLinkPreference).mockResolvedValueOnce(false)
		await openUrl('https://x.test/')
		expect(openURL).toHaveBeenCalledWith('https://x.test/')
		expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled()
	})
})

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
