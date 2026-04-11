import {afterAll, beforeAll, beforeEach, test} from '@jest/globals'
import {by, device, element, expect, system} from 'detox'

// launch the app once - do this per-test-file to grant only the permissions
// needed for a given test
//
// `delete: true` gives us a clean install so the alternate icon starts at
// the default. iOS persists the alternate icon name across normal app
// launches, so we need a fresh install to guarantee a known starting state.
beforeAll(async () => {
	await device.launchApp({delete: true})
})

// in this file, only reload the rn stuff between tests
beforeEach(async () => {
	await device.reloadReactNative()
})

// Make sure the icon is reset to default when the suite finishes so the next
// test file doesn't inherit a changed icon.
afterAll(async () => {
	try {
		await element(by.id('app-icon-cell-default')).tap()
		await system.element(by.system.label('OK')).atIndex(0).tap()
	} catch {
		// Already the default icon, nothing to reset.
	}
})

// Dismisses the iOS system alert that iOS raises whenever the alternate icon
// changes ("You have changed the icon to ..."). The alert is a system-owned
// view, not something the app renders, so it has to be matched via Detox's
// `system` facade.
const dismissIconChangedAlert = async () => {
	await system.element(by.system.label('OK')).atIndex(0).tap()
}

test('changes the app icon to Big Ole and back to Old Main', async () => {
	await element(by.id('button-open-settings')).tap()

	// The default icon should be selected on a fresh install.
	await expect(element(by.id('app-icon-cell-default-selected'))).toBeVisible()
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()

	// Switch to Big Ole.
	await element(by.id('app-icon-cell-icon_type_windmill')).tap()
	await dismissIconChangedAlert()

	// Big Ole is now selected; Old Main is not.
	await expect(
		element(by.id('app-icon-cell-icon_type_windmill-selected')),
	).toBeVisible()
	await expect(element(by.id('app-icon-cell-default'))).toBeVisible()

	// Switch back to the default (Old Main).
	await element(by.id('app-icon-cell-default')).tap()
	await dismissIconChangedAlert()

	await expect(element(by.id('app-icon-cell-default-selected'))).toBeVisible()
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()
})
