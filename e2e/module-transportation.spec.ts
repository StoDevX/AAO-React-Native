import {beforeAll, beforeEach, it, test} from '@jest/globals'
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

	// Expect the Transportation button to be present, and tap on it
	await expect(element(by.text('Transportation'))).toBeVisible()
	await element(by.text('Transportation')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

it('has the Transportation view visible by default', async () => {
	// Navigate into Transportation
	await element(by.text('Transportation')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// The view should be visible now
	await expect(element(by.text('Transportation'))).toBeVisible()
})

test.each`
	tab
	${'Express Bus'}
	${'Red Line'}
	${'Blue Line'}
	${'Oles Go'}
	${'Other Modes'}
`('$tab tab can be opened', async ({tab}) => {
	// Navigate into Transportation
	await element(by.text('Transportation')).tap()

	let tabMatcher = by.text(tab)
	await expect(element(tabMatcher)).toBeVisible()
	await element(tabMatcher).tap()
})
