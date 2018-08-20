/* eslint-env jest */
/* global element, device, by */

describe('Basic smoke tests', () => {
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
		await element(by.id('header-back')).tap()
		await expect(element(by.id('screen-homescreen'))).toBeVisible()
	})
})
