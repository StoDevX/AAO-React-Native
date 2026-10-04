import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {LogBox} from 'react-native'

import {hideLogBoxForUITests, removeLogBoxForChaos} from '../logbox'

afterEach(() => {
	jest.restoreAllMocks()
})

describe('hideLogBoxForUITests', () => {
	// LogBox's toast sits over the bottom of the screen -- a tab bar, a search
	// bar -- and a UI test that taps there taps the toast instead.
	test('hides LogBox for a UI-test launch', () => {
		let ignoreAllLogs = jest.spyOn(LogBox, 'ignoreAllLogs').mockReturnValue(undefined)

		hideLogBoxForUITests(true)

		expect(ignoreAllLogs).toHaveBeenCalledWith(true)
	})

	// Someone running the app by hand wants to see what went wrong.
	test('leaves LogBox alone for any other launch', () => {
		let ignoreAllLogs = jest.spyOn(LogBox, 'ignoreAllLogs').mockReturnValue(undefined)

		hideLogBoxForUITests(false)

		expect(ignoreAllLogs).not.toHaveBeenCalled()
	})
})

describe('removeLogBoxForChaos', () => {
	// LogBox's red screen covers the app, and with it the beacon a chaos run
	// reads, so a render error looked like a hang instead of a fatal.
	test('uninstalls LogBox for a chaos launch', () => {
		let uninstall = jest.spyOn(LogBox, 'uninstall').mockReturnValue(undefined)

		removeLogBoxForChaos(true)

		expect(uninstall).toHaveBeenCalled()
	})

	test('leaves LogBox installed for any other launch', () => {
		let uninstall = jest.spyOn(LogBox, 'uninstall').mockReturnValue(undefined)

		removeLogBoxForChaos(false)

		expect(uninstall).not.toHaveBeenCalled()
	})
})

describe('at launch', () => {
	/** Loads the module as a launch with these flags would, returning LogBox's spies. */
	function launch(flags: {isUITesting: boolean; isChaos: boolean}) {
		jest.resetModules()
		jest.doMock('@frogpond/launch-arguments', () => flags)
		// The module loads a fresh copy of react-native now, so the spies go on that one.
		// oxlint-disable-next-line typescript/no-require-imports
		let {LogBox: fresh} = require('react-native') as typeof import('react-native')
		let ignoreAllLogs = jest.spyOn(fresh, 'ignoreAllLogs').mockReturnValue(undefined)
		let uninstall = jest.spyOn(fresh, 'uninstall').mockReturnValue(undefined)
		// oxlint-disable-next-line typescript/no-require-imports
		require('../logbox')
		return {ignoreAllLogs, uninstall}
	}

	// Uninstalling leaves the native warning handler in place, so a native
	// warning still raises a toast unless LogBox is also told to ignore it.
	test('a chaos launch uninstalls LogBox and hides its toasts', () => {
		let {ignoreAllLogs, uninstall} = launch({isUITesting: false, isChaos: true})

		expect(uninstall).toHaveBeenCalled()
		expect(ignoreAllLogs).toHaveBeenCalledWith(true)
	})

	test('a UI-test launch hides the toasts and keeps LogBox', () => {
		let {ignoreAllLogs, uninstall} = launch({isUITesting: true, isChaos: false})

		expect(ignoreAllLogs).toHaveBeenCalledWith(true)
		expect(uninstall).not.toHaveBeenCalled()
	})
})
