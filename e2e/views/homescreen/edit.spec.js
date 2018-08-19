/* eslint-env jest */
/* global element, device, by */

describe('Edit Home tests to reorganize the home screen.', () => {
	it('should show home screen after tap to exit edit-home screen', async () => {
		await device.reloadReactNative()
		await element(by.id('button-open-edit-home')).tap()
		await element(by.id('header-back')).tap()
		await expect(element(by.id('screen-homescreen'))).toBeVisible()
	})
})
