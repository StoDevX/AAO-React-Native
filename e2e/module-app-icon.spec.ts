import {afterAll, beforeAll, test} from '@jest/globals'
import {by, device, element, expect, waitFor} from 'detox'

// Reinstall the app so this spec has a deterministic starting state. iOS
// persists the alternate icon name across normal app launches, so without
// a fresh install a previous run that left Big Ole selected would leak
// into this one. The reinstall is also why we need the cold-start
// hittability workarounds below.
beforeAll(async () => {
	await device.launchApp({delete: true})
})

// Reinstall again on teardown so the next spec file in this shard starts
// from a clean default state as well.
afterAll(async () => {
	await device.launchApp({delete: true})
})

// Absolute screen coordinates of the settings button in the home screen's
// navigation header, on iPhone 16 Pro (the device pinned in
// `detox.config.js`). The button sits in the top-right of the native-stack
// header; these coordinates land well inside its ~60×26 hit area without
// depending on exact trailing-inset math.
const SETTINGS_BUTTON_DEVICE_POINT = {x: 380, y: 80}

// Absolute screen coordinates of the OK button inside the iOS system alert
// that appears whenever the alternate icon changes ("You have changed the
// icon for …"). On iPhone 16 Pro the alert is a standard UIAlertController
// centered at x=196; the OK button sits at the bottom of the alert.
//
// We use coordinate taps instead of Detox's system.element API because the
// XCUITest runner consistently fails to match the system alert's OK button,
// hanging for ~55s before throwing a DetoxRuntimeError.
const ALERT_OK_BUTTON_DEVICE_POINT = {x: 196, y: 395}

// Dismisses the iOS system alert that iOS raises whenever the alternate
// icon changes. Uses a device-level coordinate tap since the Detox system
// element API can't reliably interact with this alert. Sleeps briefly
// after tapping to let the dismissal animation finish — without this,
// the _UITransitionView from the alert's presentation controller blocks
// subsequent element interactions.
const dismissIconChangedAlert = async () => {
	// Small delay to ensure the alert has been fully presented before tapping.
	await new Promise((resolve) => setTimeout(resolve, 1000))
	await device.tap(ALERT_OK_BUTTON_DEVICE_POINT)
	await new Promise((resolve) => setTimeout(resolve, 1500))
}

test('changes the app icon to Big Ole and back to Old Main', async () => {
	// Wait for RN to mount the header so `device.tap` hits something real.
	// We use `.toExist()` (not `.toBeVisible()`) because the home
	// ScrollView can fail Detox's 75% visibility threshold during the
	// native-stack's first-launch transition, even though the header and
	// its children are perfectly renderable.
	await waitFor(element(by.id('button-open-settings')))
		.toExist()
		.withTimeout(30000)

	// Device-level tap via XCUITest coordinate tap. This bypasses Detox's
	// element hittability assertion, which fails for this button on a
	// cold start for reasons we haven't pinned down (the button isn't
	// clipped; the 100% pixel-visibility check just refuses to pass).
	await device.tap(SETTINGS_BUTTON_DEVICE_POINT)

	// With a fresh install we know the starting state: default (Old Main)
	// is selected, Big Ole is not. waitFor because the device-level
	// coordinate tap doesn't block on navigation.
	await waitFor(element(by.id('app-icon-cell-default-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()

	// Switch to Big Ole.
	await element(by.id('app-icon-cell-icon_type_windmill')).tap()
	await dismissIconChangedAlert()

	// Big Ole is now selected; Old Main is not.
	await waitFor(element(by.id('app-icon-cell-icon_type_windmill-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-default'))).toBeVisible()

	// Switch back to the default (Old Main).
	await element(by.id('app-icon-cell-default')).tap()
	await dismissIconChangedAlert()

	await waitFor(element(by.id('app-icon-cell-default-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()
})
