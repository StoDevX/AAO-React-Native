import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {Alert} from 'react-native'
import * as MailComposer from 'expo-mail-composer'
import {openUrl} from '@frogpond/open-url'

import {composeEmail} from '../send-email'

jest.mock('expo-mail-composer', () => ({
	isAvailableAsync: jest.fn(),
	composeAsync: jest.fn(),
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

		await composeEmail({...email, attachments: ['file:///tmp/a.jpg']})

		expect(mockCompose).toHaveBeenCalledWith({
			recipients: ['help@example.com'],
			ccRecipients: [],
			bccRecipients: [],
			subject: 'a report',
			body: 'the details',
			attachments: ['file:///tmp/a.jpg'],
		})
		expect(mockOpenUrl).not.toHaveBeenCalled()
	})

	it('opens a mailto link when Mail cannot send and there is nothing to attach', async () => {
		mockIsAvailable.mockResolvedValue(false)
		let alert = jest.spyOn(Alert, 'alert')

		await composeEmail(email)

		expect(mockOpenUrl).toHaveBeenCalledWith(
			'mailto:help@example.com?subject=a%20report&body=the%20details',
		)
		expect(mockCompose).not.toHaveBeenCalled()
		expect(alert).not.toHaveBeenCalled()
	})

	it('asks before dropping attachments a mailto link cannot carry', async () => {
		mockIsAvailable.mockResolvedValue(false)
		let alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)

		await composeEmail({...email, attachments: ['file:///tmp/a.jpg']})

		expect(mockOpenUrl).not.toHaveBeenCalled()

		let buttons = alert.mock.calls[0][2] ?? []
		let sendWithout = buttons.find((button) => button.text === 'Send Without Images')
		sendWithout?.onPress?.()

		expect(mockOpenUrl).toHaveBeenCalledWith(
			'mailto:help@example.com?subject=a%20report&body=the%20details',
		)
	})
})
