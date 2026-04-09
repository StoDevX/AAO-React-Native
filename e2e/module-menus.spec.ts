import {beforeAll, beforeEach, it, test, describe} from '@jest/globals'
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

	// Expect the Menus button to be present, and tap on it
	await expect(element(by.text('Menus'))).toBeVisible()
	await element(by.text('Menus')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})

it('has the Menus list visible by default', async () => {
	// Navigate into Menus
	await element(by.text('Menus')).tap()

	// Verify that the navigation took us away from the homescreen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// The menu should be visible now
	await expect(element(by.text('Menus'))).toBeVisible()
})

test.each`
	tab
	${'Stav Hall'}
	${'The Cage'}
	${'The Pause'}
`('$tab menu can be opened', async ({tab}) => {
	// Navigate into the menu
	await element(by.text('Menus')).tap()

	let tabMatcher = by.text(tab)
	await expect(element(tabMatcher)).toBeVisible()
	await element(tabMatcher).tap()

	await expect(element(by.text('Specials Only'))).toBeVisible()
})

describe('carleton menus', () => {
	test.each`
		menu
		${'Burton'}
		${'LDC'}
		${'Weitz Center'}
		${'Sayles Hill'}
	`('$menu menu can be opened', async ({menu}) => {
		// Navigate into the menu
		await element(by.text('Menus')).tap()

		let tabMatcher = by.text('Carleton')
		await expect(element(tabMatcher)).toBeVisible()
		await element(tabMatcher).tap()

		let listItemMatcher = by.text(menu)
		await expect(element(listItemMatcher)).toBeVisible()
		await element(listItemMatcher).tap()

		await expect(element(by.text('Specials Only'))).toBeVisible()
	})
})
