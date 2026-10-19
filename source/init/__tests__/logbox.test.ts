import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {LogBox} from 'react-native'

import {removeLogBox} from '../logbox'

afterEach(() => {
	jest.restoreAllMocks()
})

describe('removeLogBox', () => {
	// LogBox's toast sits over the bottom of the screen -- a tab bar, the radio's
	// action row -- and a finger aimed at the control under it lands on the toast.
	test('uninstalls LogBox and hides its toasts', () => {
		let uninstall = jest.spyOn(LogBox, 'uninstall').mockReturnValue(undefined)
		let ignoreAllLogs = jest.spyOn(LogBox, 'ignoreAllLogs').mockReturnValue(undefined)

		removeLogBox()

		expect(uninstall).toHaveBeenCalled()
		expect(ignoreAllLogs).toHaveBeenCalledWith(true)
	})
})
