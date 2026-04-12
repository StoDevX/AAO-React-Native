import {afterAll, beforeAll, test} from '@jest/globals'
import {by, device, element, expect, system, waitFor} from 'detox'

// launch the app once - do this per-test-file to grant only the permissions
// needed for a given test
//
// `delete: true` gives us a clean install so the alternate icon starts at
// the default. iOS persists the alternate icon name across normal app
// launches, so we need a fresh install to guarantee a known starting state.
beforeAll(async () => {
	await device.launchApp({delete: true})
})

// Reinstall the app after this suite runs so the alternate icon (which iOS
// persists across normal launches) can't leak into subsequent specs, even if
// a test errored partway through without restoring the default.
afterAll(async () => {
	await device.launchApp({delete: true})
})

// Dismisses the iOS system alert that iOS raises whenever the alternate icon
// changes ("You have changed the icon to ..."). The alert is a system-owned
// view, not something the app renders, so it has to be matched via Detox's
// `system` facade.
const dismissIconChangedAlert = async () => {
	await system.element(by.system.label('OK')).atIndex(0).tap()
}

test('changes the app icon to Big Ole and back to Old Main', async () => {
	// After a fresh install (`delete: true`), the native navigation header
	// can still be animating into place when the first tap is attempted, which
	// trips Detox's 100% visibility check on the header's settings button. Wait
	// for the home screen and its header button to settle before tapping.
	await waitFor(element(by.id('screen-homescreen')))
		.toBeVisible()
		.withTimeout(10000)
	await waitFor(element(by.id('button-open-settings')))
		.toBeVisible(100)
		.withTimeout(10000)

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
