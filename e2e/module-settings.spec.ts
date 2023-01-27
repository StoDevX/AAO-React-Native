import {beforeAll, beforeEach, test} from '@jest/globals'
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

test('should show the settings screen after tap', async () => {
	await element(by.id('button-open-settings')).tap()
	await expect(element(by.text('Sign In to St. Olaf'))).toBeVisible()
})

test('should show home screen after tap to exit settings screen', async () => {
	await element(by.id('button-open-settings')).tap()
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
	await element(by.text('Done')).tap()
	await expect(element(by.id('screen-homescreen'))).toBeVisible()
})
