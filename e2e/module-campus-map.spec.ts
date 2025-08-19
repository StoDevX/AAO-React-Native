import {beforeAll, beforeEach, it, xit} from '@jest/globals'
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

it('is reachable from the homescreen', async () => {
	// Start at the home screen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()

	// Expect the Campus Map button to be present, and tap on it
	await expect(element(by.text('Campus Map'))).toBeVisible()
	await element(by.text('Campus Map')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

// TODO: disabled because it won't touch the Done button in the SFViewController
xit('returns you to the homescreen when closed', async () => {
	// Start at the home screen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()

	// Expect the Campus Map button to be present, and tap on it
	await expect(element(by.text('Campus Map'))).toBeVisible()
	await element(by.text('Campus Map')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// Expect the Done button to be present, and tap on it
	await expect(element(by.text('Done'))).toBeVisible()
	await element(by.text('Done')).tap()

	// Verify that the navigation returned us to the homescreen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()
})
