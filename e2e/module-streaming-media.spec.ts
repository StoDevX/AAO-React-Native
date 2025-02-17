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

test('is reachable from the homescreen', async () => {
	// Start at the home screen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()

	// Expect the Streaming Media button to be present, and tap on it
	await expect(element(by.text('Streaming Media'))).toBeVisible()
	await element(by.text('Streaming Media')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

test('has the Stream List visible by default', async () => {
	// Navigate into Streaming Media
	await element(by.text('Streaming Media')).tap()

	// The stream-list should be visible now
	await expect(element(by.id('stream-list'))).toBeVisible()
})

test.each`
	tab          | text
	${'Webcams'} | ${'East Quad'}
	${'KSTO'}    | ${'KSTO 93.1 FM'}
	${'KRLX'}    | ${'88.1 KRLX-FM'}
`('$tab tab can be opened and has text "$text"', async ({tab, text}) => {
	// Navigate into the menu
	await element(by.text('Streaming Media')).tap()

	let tabMatcher = by.text(tab)
	await expect(element(tabMatcher)).toBeVisible()
	await element(tabMatcher).tap()

	await expect(element(by.text(text))).toBeVisible()
})
