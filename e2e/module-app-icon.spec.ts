import {afterAll, test} from '@jest/globals'
import {by, device, element, expect, system, waitFor} from 'detox'

// Reinstall on teardown so the next spec file in this shard starts
// from a clean default state.
afterAll(async () => {
	await device.launchApp({delete: true})
})

// Absolute screen coordinates of the settings button in the home screen's
// navigation header, on iPhone 16 Pro (the device pinned in
// `detox.config.js`). The button sits in the top-right of the native-stack
// header; these coordinates land well inside its ~60×26 hit area without
// depending on exact trailing-inset math.
const SETTINGS_BUTTON_DEVICE_POINT = {x: 380, y: 80}

// Fresh-install the app, then navigate from the home screen to settings.
// Each test gets a clean install so leaked icon state can't cross tests.
const freshLaunchAndNavigateToSettings = async () => {
	await device.launchApp({delete: true})

	await waitFor(element(by.id('button-open-settings')))
		.toExist()
		.withTimeout(30000)

	await device.tap(SETTINGS_BUTTON_DEVICE_POINT)

	// waitFor because the device-level coordinate tap doesn't block on
	// the navigation transition.
	await waitFor(element(by.id('app-icon-cell-default-selected')))
		.toBeVisible()
		.withTimeout(10000)
}

// ---------------------------------------------------------------------------
// Hypothesis 1: The system alert hasn't appeared yet when we try to tap OK.
//
// changeIcon() is a native bridge call. Detox returns control to the test
// as soon as the JS onPress handler fires, but iOS may not have finished
// presenting the alert by the time dismissIconChangedAlert runs. If the
// OK button doesn't exist yet, the system tap silently fails.
//
// Fix: Sleep BEFORE tapping OK to give the alert time to appear.
// ---------------------------------------------------------------------------
test('H1: sleep before tapping OK to let alert appear', async () => {
	await freshLaunchAndNavigateToSettings()

	// Switch to Big Ole
	await element(by.id('app-icon-cell-icon_type_windmill')).tap()

	// H1: wait for alert to appear, then tap, then wait for dismiss animation
	await new Promise((r) => setTimeout(r, 2000))
	await system.element(by.system.label('OK')).atIndex(0).tap()
	await new Promise((r) => setTimeout(r, 1500))

	await expect(
		element(by.id('app-icon-cell-icon_type_windmill-selected')),
	).toBeVisible()
	await expect(element(by.id('app-icon-cell-default'))).toBeVisible()

	// Switch back to default
	await element(by.id('app-icon-cell-default')).tap()

	await new Promise((r) => setTimeout(r, 2000))
	await system.element(by.system.label('OK')).atIndex(0).tap()
	await new Promise((r) => setTimeout(r, 1500))

	await expect(element(by.id('app-icon-cell-default-selected'))).toBeVisible()
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()
})

// ---------------------------------------------------------------------------
// Hypothesis 2: The OK tap works, but _UITransitionView lingers longer than
// 1500ms on CI, blocking subsequent cell taps and visibility checks.
//
// Fix: Replace fixed post-tap sleep with condition-based waiting — poll
// until the expected cell testID is visible.
// ---------------------------------------------------------------------------
test('H2: condition-based wait after tapping OK', async () => {
	await freshLaunchAndNavigateToSettings()

	// Switch to Big Ole
	await element(by.id('app-icon-cell-icon_type_windmill')).tap()

	// H2: tap OK immediately, then waitFor the expected state
	await system.element(by.system.label('OK')).atIndex(0).tap()
	await waitFor(element(by.id('app-icon-cell-icon_type_windmill-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-default'))).toBeVisible()

	// Switch back to default
	await element(by.id('app-icon-cell-default')).tap()

	await system.element(by.system.label('OK')).atIndex(0).tap()
	await waitFor(element(by.id('app-icon-cell-default-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()
})

// ---------------------------------------------------------------------------
// Hypothesis 3: Both issues compound — the alert needs time to appear AND
// post-dismissal needs condition-based waiting.
//
// Fix: Sleep before tapping OK + waitFor after tapping.
// ---------------------------------------------------------------------------
test('H3: sleep before tap + condition-based wait after', async () => {
	await freshLaunchAndNavigateToSettings()

	// Switch to Big Ole
	await element(by.id('app-icon-cell-icon_type_windmill')).tap()

	// H3: wait for alert, tap, then waitFor result
	await new Promise((r) => setTimeout(r, 2000))
	await system.element(by.system.label('OK')).atIndex(0).tap()
	await waitFor(element(by.id('app-icon-cell-icon_type_windmill-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-default'))).toBeVisible()

	// Switch back to default
	await element(by.id('app-icon-cell-default')).tap()

	await new Promise((r) => setTimeout(r, 2000))
	await system.element(by.system.label('OK')).atIndex(0).tap()
	await waitFor(element(by.id('app-icon-cell-default-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()
})
