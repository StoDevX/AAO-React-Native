import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {Alert} from 'react-native'
import * as MailComposer from 'expo-mail-composer'
import {openUrl} from '@frogpond/open-url'

import {composeEmail} from '../send-email'

jest.mock('expo-mail-composer', () => ({
	isAvailableAsync: jest.fn(),
	composeAsync: jest.fn(),
	MailComposerStatus: {
		UNDETERMINED: 'undetermined',
		SENT: 'sent',
		SAVED: 'saved',
		CANCELLED: 'cancelled',
	},
}))
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))

const mockIsAvailable = MailComposer.isAvailableAsync as jest.MockedFunction<
	typeof MailComposer.isAvailableAsync
>
const mockCompose = MailComposer.composeAsync as jest.MockedFunction<
	typeof MailComposer.composeAsync
>
const mockOpenUrl = openUrl as jest.MockedFunction<typeof openUrl>

const email = {
	to: ['help@example.com'],
	subject: 'a report',
	body: 'the details',
}

describe('composeEmail', () => {
	afterEach(() => {
		jest.clearAllMocks()
		jest.restoreAllMocks()
	})

	it('writes the email in the mail composer, with its attachments, when Mail can send', async () => {
		mockIsAvailable.mockResolvedValue(true)
		mockCompose.mockResolvedValue({status: MailComposer.MailComposerStatus.SENT})

		let handedOff = await composeEmail({...email, attachments: ['file:///tmp/a.jpg']})

		expect(mockCompose).toHaveBeenCalledWith({
			recipients: ['help@example.com'],
			ccRecipients: [],
			bccRecipients: [],
			subject: 'a report',
			body: 'the details',
			attachments: ['file:///tmp/a.jpg'],
		})
		expect(mockOpenUrl).not.toHaveBeenCalled()
		expect(handedOff).toBe(true)
	})

	it('counts a draft saved from the mail composer as handed off', async () => {
		mockIsAvailable.mockResolvedValue(true)
		mockCompose.mockResolvedValue({status: MailComposer.MailComposerStatus.SAVED})

		await expect(composeEmail({...email, attachments: ['file:///tmp/a.jpg']})).resolves.toBe(true)
	})

	it('reports a cancelled mail composer as not handed off', async () => {
		mockIsAvailable.mockResolvedValue(true)
		mockCompose.mockResolvedValue({status: MailComposer.MailComposerStatus.CANCELLED})

		await expect(composeEmail({...email, attachments: ['file:///tmp/a.jpg']})).resolves.toBe(false)
	})

	it('rejects when the mail composer cannot open', async () => {
		mockIsAvailable.mockResolvedValue(true)
		mockCompose.mockRejectedValue(new Error('another sheet is open'))

		await expect(composeEmail({...email, attachments: ['file:///tmp/a.jpg']})).rejects.toThrow(
			'another sheet is open',
		)
	})

	it('rejects when Mail cannot say whether it can send', async () => {
		mockIsAvailable.mockRejectedValue(new Error('no module'))

		await expect(composeEmail({...email, attachments: ['file:///tmp/a.jpg']})).rejects.toThrow(
			'no module',
		)
	})

	// The mailto link opens whichever mail app the reader chose; the composer
	// is always Apple Mail, so it is kept for the emails that need it.
	it('opens a mailto link when there is nothing to attach, even when Mail can send', async () => {
		mockIsAvailable.mockResolvedValue(true)
		let alert = jest.spyOn(Alert, 'alert')

		let handedOff = await composeEmail(email)

		expect(mockOpenUrl).toHaveBeenCalledWith(
			'mailto:help@example.com?subject=a%20report&body=the%20details',
		)
		expect(mockCompose).not.toHaveBeenCalled()
		expect(alert).not.toHaveBeenCalled()
		expect(handedOff).toBe(true)
	})

	describe('when Mail cannot send and there are attachments', () => {
		/** Resolves with the alert's buttons once `composeEmail` has shown it. */
		function nextAlert(): Promise<Parameters<typeof Alert.alert>[2]> {
			return new Promise((resolve) => {
				jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
					resolve(buttons)
				})
			})
		}

		function press(buttons: Parameters<typeof Alert.alert>[2], text: string) {
			buttons?.find((button) => button.text === text)?.onPress?.()
		}

		it('asks before dropping attachments a mailto link cannot carry', async () => {
			mockIsAvailable.mockResolvedValue(false)
			let alert = nextAlert()

			let handedOff = composeEmail({...email, attachments: ['file:///tmp/a.jpg']})
			let buttons = await alert

			expect(mockOpenUrl).not.toHaveBeenCalled()

			press(buttons, 'Send Without Images')

			expect(mockOpenUrl).toHaveBeenCalledWith(
				'mailto:help@example.com?subject=a%20report&body=the%20details',
			)
			await expect(handedOff).resolves.toBe(true)
		})

		it('sends nothing when the question is cancelled', async () => {
			mockIsAvailable.mockResolvedValue(false)
			let alert = nextAlert()

			let handedOff = composeEmail({...email, attachments: ['file:///tmp/a.jpg']})
			press(await alert, 'Cancel')

			await expect(handedOff).resolves.toBe(false)
			expect(mockOpenUrl).not.toHaveBeenCalled()
			expect(mockCompose).not.toHaveBeenCalled()
		})
	})
})
