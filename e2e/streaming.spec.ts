import {beforeAll, beforeEach, describe, it} from '@jest/globals'
import {by, device, element, expect} from 'detox'

// launch the app once - do this per-test-file to grant only the permissions
// needed for a given test
beforeAll(async () => {
	await device.launchApp()
})

// in this file, only reload the rn stuff between tests
beforeEach(async () => {
	await device.reloadReactNative()
})

describe('Streaming Media View', () => {
	it('is reachable from the homescreen', async () => {
		// Start at the home screen
		await expect(element(by.id('screen-homescreen'))).toBeVisible()

		// Expect the Streaming Media button to be present, and tap on it
		await expect(
			element(by.id('homescreen-button-Streaming Media')),
		).toBeVisible()
		await element(by.id('homescreen-button-Streaming Media')).tap()

		// Verify that the navigation took us away from the homescreen
		await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
	})

	it('has the Stream List visible by default', async () => {
		// Navigate into Streaming Media
		await element(by.id('homescreen-button-Streaming Media')).tap()

		// The stream-list should be visible now
		await expect(element(by.id('stream-list'))).toBeVisible()
	})

	describe('Webcams', () => {
		it('is reachable under the home screen', async () => {
			// Navigate into Streaming Media
			await element(by.id('homescreen-button-Streaming Media')).tap()

			// Enter the ksto view
			await expect(element(by.id('tab-Webcams'))).toBeVisible()
			await element(by.id('tab-Webcams')).tap()
			await expect(element(by.id('screen-streaming-webcams'))).toBeVisible()
		})
	})

	describe('KSTO Radio View', () => {
		it('is reachable under the home screen', async () => {
			// Navigate into Streaming Media
			await element(by.id('homescreen-button-Streaming Media')).tap()

			// Enter the ksto view
			await expect(element(by.id('tab-KSTO'))).toBeVisible()
			await element(by.id('tab-KSTO')).tap()
			await expect(element(by.id('screen-streaming-radio-ksto'))).toBeVisible()
		})
	})

	describe('KRLX Radio View', () => {
		it('is reachable under the home screen', async () => {
			// Navigate into Streaming Media
			await element(by.id('homescreen-button-Streaming Media')).tap()

			// Enter the ksto view
			await expect(element(by.id('tab-KRLX'))).toBeVisible()
			await element(by.id('tab-KRLX')).tap()
			await expect(element(by.id('screen-streaming-radio-krlx'))).toBeVisible()
		})
	})
})
