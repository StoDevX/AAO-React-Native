import {beforeAll, beforeEach, it, xit} from '@jest/globals'
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

it('is reachable from the homescreen', async () => {
	// Start at the home screen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()

	// Expect the stoPrint button to be present, and tap on it
	await expect(element(by.text('stoPrint'))).toBeVisible()
	await element(by.text('stoPrint')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

// TODO: skipped — stoPrint API request hangs in CI, shows "Loading..." instead
xit('says "you are not logged in" by default', async () => {
	// Navigate into stoPrint
	await element(by.text('stoPrint')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
	await expect(element(by.text('You are not logged in'))).toBeVisible()
})
