import {beforeAll, beforeEach, it} from '@jest/globals'
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

	// Expect the Course Catalog button to be present, and tap on it
	await expect(element(by.text('Course Catalog'))).toBeVisible()
	await element(by.text('Course Catalog')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

it('has the search view visible by default', async () => {
	// Navigate into Course Catalog
	await element(by.text('Course Catalog')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// The search interface should be visible now
	await expect(element(by.text('Course Catalog'))).toBeVisible()
	await expect(element(by.text('Browse'))).toBeVisible()
	await expect(element(by.text('Recent'))).toBeVisible()
})
