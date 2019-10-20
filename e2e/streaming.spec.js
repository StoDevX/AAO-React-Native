/* eslint-env jest */
/* global element, by */

describe('Streaming Media View', () => {
	it('is reachable from the homescreen', async () => {
		// Start at the home screen
		await expect(element(by.id('screen-homescreen'))).toBeVisible()

		// Expect the StreamingView button to be present, and tap on it
		await expect(
			element(by.id('homescreen-button-StreamingView')),
		).toBeVisible()
		await element(by.id('homescreen-button-StreamingView')).tap()

		// Verify that the navigation took us away from the homescreen
		await expect(element(by.id('screen-homescreen'))).toBeNotVisible()
	})

	it('has the Stream List visible by default', async () => {
		// Navigate into StreamingView
		await element(by.id('homescreen-button-StreamingView')).tap()

		// The stream-list should be visible now
		await expect(element(by.id('stream-list'))).toBeVisible()
	})

	describe('KSTO Radio View', () => {
		it('is reachable under the home screen', async () => {
			// Navigate into StreamingView
			await element(by.id('homescreen-button-StreamingView')).tap()

			// Enter the ksto view
			await element(by.id('button-ksto')).tap()
			await expect(element(by.id('screen-streaming-radio-ksto'))).toBeVisible()
		})
	})

	describe('KRLX Radio View', () => {
		it('is reachable under the home screen', async () => {
			// Navigate into StreamingView
			await element(by.id('homescreen-button-StreamingView')).tap()

			// Enter the ksto view
			await element(by.id('button-krlx')).tap()
			await expect(element(by.id('screen-streaming-radio-krlx'))).toBeVisible()
		})
	})
})
