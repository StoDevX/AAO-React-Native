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

	// Expect the Calendar button to be present, and tap on it
	await expect(element(by.text('Calendar'))).toBeVisible()
	await element(by.text('Calendar')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

it('has the Calendar list visible by default', async () => {
	// Navigate into Calendar
	await element(by.text('Calendar')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// The list of events should be visible now
	await expect(element(by.text('Calendar'))).toBeVisible()
})

test.each`
	calendar
	${'St. Olaf'}
	${'Oleville'}
	${'Northfield'}
`('$calendar calendar can be opened', async ({calendar}) => {
	// Navigate into the calendar
	await element(by.text('Calendar')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// The list of events should be visible now
	await expect(element(by.text('Calendar'))).toBeVisible()

	let matcher = by.text(calendar)
	await expect(element(matcher)).toBeVisible()
	await element(matcher).tap()
})
