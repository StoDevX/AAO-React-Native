import {afterAll, beforeAll, test} from '@jest/globals'
import {by, device, element, expect, waitFor} from 'detox'

// Reinstall the app so this spec has a deterministic starting state. iOS
// persists the alternate icon name across normal app launches, so without
// a fresh install a previous run that left Big Ole selected would leak
// into this one.
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

// Navigate from the home screen to the app's settings screen.
const navigateToSettings = async () => {
	await waitFor(element(by.id('button-open-settings')))
		.toExist()
		.withTimeout(30000)

	await device.tap(SETTINGS_BUTTON_DEVICE_POINT)
}

// Taps an icon cell, then relaunches the app and navigates back to
// settings. iOS shows a system alert whenever the alternate icon changes
// ("You have changed the icon for …"). Detox cannot dismiss this alert:
//
//   - system.element(by.system.label('OK')): the XCUITest runner hangs
//     for ~55s then throws DetoxRuntimeError
//   - device.tap(coordinates): the tap goes to the app's coordinate
//     space, passing under the alert's SpringBoard-owned window layer
//   - device.sendToHome(): hangs while the alert is presented
//
// The only reliable escape is to kill the app process (which tears down
// the alert) and relaunch. The icon change persists because iOS commits
// it before showing the alert. After relaunching we navigate back to
// settings so the caller can verify the new icon state.
const changeIconAndReturn = async (cellTestID: string) => {
	await element(by.id(cellTestID)).tap()

	// Brief delay so iOS commits the icon change before we kill the process.
	await new Promise((resolve) => setTimeout(resolve, 1000))

	await device.launchApp({newInstance: true})
	await navigateToSettings()
}

test('changes the app icon to Big Ole and back to Old Main', async () => {
	await navigateToSettings()

	// With a fresh install we know the starting state: default (Old Main)
	// is selected, Big Ole is not.
	await waitFor(element(by.id('app-icon-cell-default-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()

	// Switch to Big Ole, relaunch to dismiss the system alert, come back.
	await changeIconAndReturn('app-icon-cell-icon_type_windmill')

	// Big Ole is now selected; Old Main is not.
	await waitFor(element(by.id('app-icon-cell-icon_type_windmill-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-default'))).toBeVisible()

	// Switch back to the default (Old Main), relaunch, come back.
	await changeIconAndReturn('app-icon-cell-default')

	// Default is selected again.
	await waitFor(element(by.id('app-icon-cell-default-selected')))
		.toBeVisible()
		.withTimeout(10000)
	await expect(element(by.id('app-icon-cell-icon_type_windmill'))).toBeVisible()
}, // Two app relaunches + navigations make this test slower than average.
120_000)
