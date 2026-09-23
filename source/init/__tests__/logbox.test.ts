import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {LogBox} from 'react-native'

import {hideLogBoxForUITests} from '../logbox'

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
