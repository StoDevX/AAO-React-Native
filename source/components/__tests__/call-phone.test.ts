import {Alert} from 'react-native'
import noop from 'lodash/noop'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import * as Clipboard from 'expo-clipboard'
import {hasAppFor, openUrl} from '@frogpond/open-url'

import {callPhone} from '../call-phone'
import {lastAlertTitle, pressAlertButton} from '../../testing/alert'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn(), hasAppFor: jest.fn()}))
jest.mock('expo-clipboard', () => ({setStringAsync: jest.fn()}))

const NUMBER = '+15072224127'
const CANNOT_CALL = "Apologies, we couldn't call that number"

/** Lets the call's pending checks settle. */
function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

describe('callPhone', () => {
	beforeEach(() => {
		jest.spyOn(Alert, 'alert').mockImplementation(noop)
	})

	afterEach(() => {
		jest.restoreAllMocks()
		jest.mocked(openUrl).mockReset()
		jest.mocked(hasAppFor).mockReset()
		jest.mocked(Clipboard.setStringAsync).mockReset()
	})

	test('offers to copy the number on a device that cannot call', async () => {
		jest.mocked(hasAppFor).mockResolvedValue(false)

		callPhone(NUMBER, {title: 'KRLX'})
		pressAlertButton('Call')
		await settle()

		expect(lastAlertTitle()).toBe(CANNOT_CALL)
		expect(openUrl).not.toHaveBeenCalled()

		pressAlertButton('Copy number')
		expect(Clipboard.setStringAsync).toHaveBeenCalledWith(NUMBER)
	})

	// Whether the call then goes through is iOS's to say: cancelling its own
	// "Call …?" confirmation reports failure, and that is not an apology.
	test('opens the call and says nothing more, however iOS answers', async () => {
		jest.mocked(hasAppFor).mockResolvedValue(true)
		jest.mocked(openUrl).mockResolvedValue(false)

		callPhone(NUMBER, {title: 'KRLX'})
		pressAlertButton('Call')
		await settle()

		expect(openUrl).toHaveBeenCalledWith(`tel:${NUMBER}`)
		expect(Alert.alert).toHaveBeenCalledTimes(1)
	})

	test('does nothing when the prompt is cancelled', async () => {
		callPhone(NUMBER, {title: 'KRLX'})
		pressAlertButton('Cancel')
		await settle()

		expect(hasAppFor).not.toHaveBeenCalled()
		expect(openUrl).not.toHaveBeenCalled()
	})

	test('calls straight away without a prompt', async () => {
		jest.mocked(hasAppFor).mockResolvedValue(true)

		callPhone(NUMBER, {prompt: false})
		await settle()

		expect(Alert.alert).not.toHaveBeenCalled()
		expect(openUrl).toHaveBeenCalledWith(`tel:${NUMBER}`)
	})
})
