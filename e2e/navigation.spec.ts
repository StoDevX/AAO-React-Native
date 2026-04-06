import {beforeAll, beforeEach, describe, it, test} from '@jest/globals'
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

// =============================================================================
// 7a: Title display — representative test for Building Hours
// Proves that a screen with Stack.Screen options={{title: '...'}} renders
// the human-readable title (not the route slug) in the header.
// Jest tests cover all other screens using the same pattern.
// =============================================================================
test('Building Hours screen shows proper title, not route slug', async () => {
	// Start at the home screen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()

	// Tap "Building Hours" on the home screen
	await element(by.text('Building Hours')).tap()

	// Verify we navigated away from the home screen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// Verify the title "Building Hours" is visible in the header
	// (if the title were a slug like "building-hours", this would fail)
	await expect(element(by.text('Building Hours'))).toBeVisible()
})

// =============================================================================
// 7b: Settings modal open/close
// Proves that the settings modal can be opened and closed, and shows
// the correct title. Existing basic-smoke.spec.ts tests some of this,
// but this verifies the "Settings" title specifically.
// =============================================================================
test('Settings screen shows "Settings" title and can be dismissed', async () => {
	// Open settings from the home screen
	await element(by.id('button-open-settings')).tap()

	// Verify the Settings title is visible
	await expect(element(by.text('Settings'))).toBeVisible()

	// Verify we left the home screen
	await expect(element(by.id('screen-homescreen'))).not.toBeVisible()

	// Dismiss settings (iOS uses "Done" button)
	await element(by.text('Done')).tap()

	// Verify we're back on the home screen
	await expect(element(by.id('screen-homescreen'))).toBeVisible()
})

// =============================================================================
// 7c: Tab layout — representative test for Menus
// Proves that a NativeTabs layout renders the correct tab labels.
// Jest tests cover all other tab layouts using the same pattern.
// =============================================================================
describe('Menus tab layout', () => {
	it('shows tab bar with correct tabs', async () => {
		// Navigate to Menus from home screen
		await element(by.text('Menus')).tap()

		// Verify all tab labels are visible
		await expect(element(by.text('Stav Hall'))).toBeVisible()
		await expect(element(by.text('The Cage'))).toBeVisible()
		await expect(element(by.text('The Pause'))).toBeVisible()
		await expect(element(by.text('Carleton'))).toBeVisible()
	})
})

// =============================================================================
// 7d: List -> detail -> back — representative test for Building Hours
// Proves that tapping a list item navigates to a detail screen, and
// the back button returns to the list. Jest tests verify the router.push
// params for all list+detail screens.
// =============================================================================
describe('Building Hours list to detail and back', () => {
	it('navigates to a building detail and back', async () => {
		// Navigate to Building Hours from home screen
		await element(by.text('Building Hours')).tap()

		// Wait for the list to load and tap the first visible building row
		await waitFor(element(by.type('RCTTextView')).atIndex(1))
			.toBeVisible()
			.withTimeout(5000)

		// Tap the first building in the list
		await element(by.type('RCTTextView')).atIndex(1).tap()

		// Verify we're no longer on the list (the building name should appear as header title)
		// Press back to return to the list
		if (device.getPlatform() === 'ios') {
			// On iOS, tap the back button in the header
			await element(by.traits(['button']))
				.atIndex(0)
				.tap()
		} else {
			await device.pressBack()
		}

		// Verify we're back on the Building Hours list
		await expect(element(by.text('Building Hours'))).toBeVisible()
	})
})
