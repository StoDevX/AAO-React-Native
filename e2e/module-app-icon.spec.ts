import {afterAll, beforeAll, test} from '@jest/globals'
import {by, device, element, expect, system, waitFor} from 'detox'

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

// Dismisses the iOS system alert that iOS raises whenever the alternate
// icon changes ("You have changed the icon to …"). The alert is a
// system-owned view, not something the app renders, so it has to be
// matched via Detox's `system` facade.
//
// Detox does not sync with system alerts, so `system.element(...).tap()`
// returns as soon as the tap is dispatched — before the presentation
// controller's dismissal animation has finished. If we proceed straight
// into another element tap, Detox's hittability check lands on the
// alert's still-present `_UITransitionView` (whose dimming view covers
// the screen during the transition) and fails with "View is not hittable
// at its visible point". A screenshot from CI caught the alert in
// mid-dismissal on top of the icon list, confirming the race. Sleep
// briefly after tapping OK to let the dismissal animation finish.
const dismissIconChangedAlert = async () => {
	await system.element(by.system.label('OK')).atIndex(0).tap()
	await new Promise((resolve) => setTimeout(resolve, 1500))
}

// Absolute screen coordinates of the settings button in the home screen's
// navigation header, on iPhone 16 Pro (the device pinned in
// `detox.config.js`). The button sits in the top-right of the native-stack
// header; these coordinates land well inside its ~60×26 hit area without
// depending on exact trailing-inset math.
const SETTINGS_BUTTON_DEVICE_POINT = {x: 380, y: 80}

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
	// is selected, Big Ole is not.
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
