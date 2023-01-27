import {beforeAll, beforeEach, describe, test} from '@jest/globals'
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

	// Expect the SIS button to be present, and tap on it
	await expect(element(by.text('SIS'))).toBeVisible()
	await element(by.text('SIS')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

describe('balances', () => {
	beforeEach(async () => {
		// go ahead and reinstall the app so that it has fresh state each time - we 
		// are agreeing to the agreement in this file.
		await device.launchApp({delete: true})
	})

	test('has the acknowledgement visible by default', async () => {
		// Navigate into SIS
		await element(by.text('SIS')).tap()
	
		// Verify that the navigation took us away from the homescreen
		await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
	
		// The acknowledgement should be visible now
		await expect(element(by.text('I Agree'))).toBeVisible()
	})

	test('shows the balances after acknowledgement', async () => {
		// Navigate into SIS
		await element(by.text('SIS')).tap()
	
		// Verify that the navigation took us away from the homescreen
		await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
	
		// The acknowledgement should be visible now
		await expect(element(by.text('I Agree'))).toBeVisible()
		await element(by.text('I Agree')).tap()

		// the ack. should be hidden now
		await expect(element(by.text('I Agree'))).not.toBeVisible()
		
		// instead, the balances fields should be visible
		await expect(element(by.text('BALANCES'))).toBeVisible()
		await expect(element(by.text('MEAL PLAN'))).toBeVisible()
	})

	test('continues to show the balances after re-opening the view', async () => {
		// Navigate into SIS
		await element(by.text('SIS')).tap()
	
		// Verify that the navigation took us away from the homescreen
		await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
	
		// The acknowledgement should be visible now
		await expect(element(by.text('I Agree'))).toBeVisible()
		await element(by.text('I Agree')).tap()

		// the ack. should be hidden now
		await expect(element(by.text('I Agree'))).not.toBeVisible()
		
		// instead, the balances fields should be visible
		await expect(element(by.text('BALANCES'))).toBeVisible()
		
		// return to the home screen
		await element(by.text('All About Olaf')).tap()
		await expect(element(by.id('screen-homescreen'))).toBeVisible()

		// Navigate into SIS
		await element(by.text('SIS')).tap()
		await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
	})
})

test.each`
	tab
	${'Open Jobs'}
`('$tab tab can be opened', async ({tab}) => {
	// Navigate into the menu
	await element(by.text('SIS')).tap()

	let tabMatcher = by.text(tab)
	await expect(element(tabMatcher)).toBeVisible()
	await element(tabMatcher).tap()

	await expect(element(by.text('Open Jobs'))).toBeVisible()
})
