/* eslint-env jest */
/* global element, by */

describe('Streaming Media View', () => {
	it('is reachable from the home screen', async () => {
		await expect(element(by.id('screen-homescreen'))).toBeVisible()
		await expect(
			element(by.id('homescreen-button-StreamingView')),
		).toBeVisible()
		await element(by.id('homescreen-button-StreamingView')).tap()
		await expect(element(by.id('screen-homescreen'))).toNotBeVisible()
		await expect(element(by.id('screen-streaming'))).toBeVisible()
	})

	it('has the Stream List visible by default', async () => {
		await expect(element(by.id('screen-homescreen'))).toBeVisible()
		await expect(
			element(by.id('homescreen-button-StreamingView')),
		).toBeVisible()
		await element(by.id('homescreen-button-StreamingView')).tap()
		await expect(element(by.id('screen-homescreen'))).toNotBeVisible()
		await expect(element(by.id('screen-streaming'))).toBeVisible()

		await expect(element(by.id('stream-list'))).toBeVisible()
	})
})

describe('KSTO Radio View', () => {
	it('is reachable under the home screen', async () => {
		await expect(element(by.id('screen-homescreen'))).toBeVisible()
		await expect(
			element(by.id('homescreen-button-StreamingView')),
		).toBeVisible()
		await element(by.id('homescreen-button-StreamingView')).tap()
		await expect(element(by.id('screen-homescreen'))).toNotBeVisible()
		await expect(element(by.id('screen-streaming'))).toBeVisible()

		await element(by.text('KSTO')).tap()
		await expect(element(by.id('screen-streaming-radio-ksto'))).toBeVisible()
	})
})
