import {Alert, type AlertButton} from 'react-native'
import noop from 'lodash/noop'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {openUrl} from '@frogpond/open-url'

import {callPhone} from '../call-phone'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
jest.mock('expo-clipboard', () => ({setStringAsync: jest.fn()}))

const mockedOpenUrl = jest.mocked(openUrl)

/** Presses the button titled `text` on the alert most recently shown. */
function press(text: string): void {
	let buttons = jest.mocked(Alert.alert).mock.lastCall?.[2] as AlertButton[] | undefined
	let button = buttons?.find((candidate) => candidate.text === text)
	if (!button?.onPress) {
		throw new Error(`No "${text}" button on the last alert`)
	}
	button.onPress()
}

/** Lets the call's pending `openUrl` settle. */
function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

describe('callPhone', () => {
	afterEach(() => {
		jest.restoreAllMocks()
		mockedOpenUrl.mockReset()
	})

	test('offers to copy the number when the call cannot be placed', async () => {
		jest.spyOn(Alert, 'alert').mockImplementation(noop)
		mockedOpenUrl.mockResolvedValue(false)

		callPhone('+15072224127', {title: 'KRLX'})
		press('Call')
		await settle()

		expect(mockedOpenUrl).toHaveBeenCalledWith('tel:+15072224127')
		expect(Alert.alert).toHaveBeenLastCalledWith(
			"Apologies, we couldn't call that number",
			expect.any(String),
			expect.arrayContaining([expect.objectContaining({text: 'Copy number'})]),
		)
	})

	test('shows nothing more once the call is placed', async () => {
		jest.spyOn(Alert, 'alert').mockImplementation(noop)
		mockedOpenUrl.mockResolvedValue(true)

		callPhone('+15072224127', {title: 'KRLX'})
		press('Call')
		await settle()

		expect(Alert.alert).toHaveBeenCalledTimes(1)
	})

	test('offers the fallback without a prompt too', async () => {
		jest.spyOn(Alert, 'alert').mockImplementation(noop)
		mockedOpenUrl.mockResolvedValue(false)

		callPhone('+15072224127', {prompt: false})
		await settle()

		expect(Alert.alert).toHaveBeenCalledTimes(1)
		expect(jest.mocked(Alert.alert).mock.lastCall?.[0]).toBe(
			"Apologies, we couldn't call that number",
		)
	})
})
