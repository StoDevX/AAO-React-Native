import {beforeAll, beforeEach, test, xtest} from '@jest/globals'
import {by, device, element, expect} from 'detox'

// launch the app once - do this per-test-file to grant only the permissions
// needed for a given test
beforeAll(async () => {
	await device.launchApp()
})

// in this file, fully relaunch the app between tests
beforeEach(async () => {
	await device.reloadReactNative()
})

test('is reachable from the homescreen', async () => {
	// Start at the home screen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()

	// Expect the Oleville button to be present, and tap on it
	await expect(element(by.text('Oleville'))).toBeVisible()
	await element(by.text('Oleville')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

// TODO: disabled because it won't touch the Done button in the SFViewController
xtest('returns you to the homescreen when closed', async () => {
	// Start at the home screen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()

	// Expect the Oleville button to be present, and tap on it
	await expect(element(by.text('Oleville'))).toBeVisible()
	await element(by.text('Oleville')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// Expect the Done button to be present, and tap on it
	await expect(element(by.text('Done'))).toBeVisible()
	await element(by.text('Done')).tap()

	// Verify that the navigation returned us to the homescreen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()
})
