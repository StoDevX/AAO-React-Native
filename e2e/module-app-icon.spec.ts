import {afterAll, beforeAll, test} from '@jest/globals'
import {by, device, element, expect, system} from 'detox'

// Launch the app normally (matching module-settings.spec.ts and friends).
//
// We deliberately avoid `delete: true` here: on a fresh install the
// native-stack header's right button fails Detox's 100%-hittable pixel
// check for reasons we haven't pinned down (nothing clips it geometrically,
// but the pixel-level visibility probe fails consistently). The same button
// is tapped without issue by `module-settings.spec.ts`, which launches
// normally. So we launch normally here too and normalize the icon state
// inside the test itself via a tap-to-reset pattern.
beforeAll(async () => {
	await device.launchApp()
})

// iOS persists the alternate icon name across normal app launches, so a
// test that errored partway through could leave Big Ole selected and leak
// into a subsequent spec. Reinstalling on afterAll guarantees the next
// spec file starts from a clean default.
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
	await element(by.id('button-open-settings')).tap()

	// Normalize the starting state. iOS remembers the alternate icon across
	// launches, so if a previous run (in this sim) landed on Big Ole, we'd
	// start this test there. Tap default if it isn't already selected.
	//
	// Tapping an already-selected icon is a no-op in the app (see
	// `IconCell`'s `setIcon`), so we can't "reset" by just always tapping
	// default — we'd never see the confirmation alert and the subsequent
	// `dismissIconChangedAlert` would hang. Instead, probe the current
	// state with a try/catch and only reset when needed.
	try {
		await expect(element(by.id('app-icon-cell-default-selected'))).toBeVisible()
	} catch {
		await element(by.id('app-icon-cell-default')).tap()
		await dismissIconChangedAlert()
	}

	// Known starting state: default (Old Main) is selected.
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
