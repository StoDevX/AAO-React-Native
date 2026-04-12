import {afterAll, beforeAll, test} from '@jest/globals'
import {by, device, element, expect, system, waitFor} from 'detox'

// Launch the app normally (matching module-settings.spec.ts and friends).
//
// The alternate-icon flow is only tappable through the settings screen,
// which we reach via the header's `button-open-settings`. On a freshly-
// installed app that button reliably fails Detox's element-level
// `dtx_assertHittableAtPoint` pixel probe — nothing clips it geometrically,
// but the 100% pixel-visibility check fails for reasons we haven't pinned
// down. Since `module-sis.spec.ts` (same shard) reinstalls via
// `{delete: true}` between its tests, this spec can't assume the app is
// warmed up even when we launch normally. We work around the hittability
// issue below by using `device.tap({x, y})` for that initial tap, which
// goes through iOS's XCUITest `coordinateTap` and bypasses Detox's
// element hit-test entirely.
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
	// element hittability assertion that fails for this button on a cold
	// start (see comment in `beforeAll`).
	await device.tap(SETTINGS_BUTTON_DEVICE_POINT)

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
