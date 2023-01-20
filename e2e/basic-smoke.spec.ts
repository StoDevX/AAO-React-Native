import {beforeAll, beforeEach, describe, it} from '@jest/globals'
import {by, device, element, expect} from 'detox'

beforeAll(async () => {
	await device.launchApp()
})

describe('Basic smoke tests', () => {
	beforeEach(async () => {
		await device.reloadReactNative()
	})

	it('should have homescreen', async () => {
		await expect(element(by.id('screen-homescreen'))).toBeVisible()
	})

	it('should show settings screen after tap', async () => {
		await element(by.id('button-open-settings')).tap()
		await expect(element(by.text('Sign In to St. Olaf'))).toBeVisible()
	})

	it('should show home screen after tap to exit settings screen', async () => {
		await element(by.id('button-open-settings')).tap()
		await expect(element(by.id('screen-homescreen'))).toBeNotVisible()
		await element(by.text('All About Olaf')).tap()
		await expect(element(by.id('screen-homescreen'))).toBeVisible()
	})
})
