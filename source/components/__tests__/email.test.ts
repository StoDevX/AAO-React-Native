import {Alert} from 'react-native'
import noop from 'lodash/noop'
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'
import * as Clipboard from 'expo-clipboard'
import {hasAppFor, openUrl} from '@frogpond/open-url'
import {formatEmailParts, sendEmail} from '../send-email'
import {lastAlertTitle, pressAlertButton} from '../../testing/alert'
import {settle} from '../../testing/settle'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn(), hasAppFor: jest.fn()}))
jest.mock('expo-clipboard', () => ({setStringAsync: jest.fn()}))

describe('sendEmail', () => {
	beforeEach(() => {
		jest.spyOn(Alert, 'alert').mockImplementation(noop)
	})

	afterEach(() => {
		jest.restoreAllMocks()
		jest.mocked(openUrl).mockReset()
		jest.mocked(hasAppFor).mockReset()
		jest.mocked(Clipboard.setStringAsync).mockReset()
	})

	it('offers to copy the addresses on a device with no mail app', async () => {
		jest.mocked(hasAppFor).mockResolvedValue(false)

		sendEmail({to: ['a@stolaf.edu', 'b@stolaf.edu']})
		await settle()

		expect(lastAlertTitle()).toBe("Apologies, we couldn't open an email client")
		expect(openUrl).not.toHaveBeenCalled()

		pressAlertButton('Copy addresses')
		expect(Clipboard.setStringAsync).toHaveBeenCalledWith('a@stolaf.edu, b@stolaf.edu')
	})

	it('opens the email and says nothing more, however iOS answers', async () => {
		jest.mocked(hasAppFor).mockResolvedValue(true)
		jest.mocked(openUrl).mockResolvedValue(false)

		sendEmail({to: ['a@stolaf.edu']})
		await settle()

		expect(openUrl).toHaveBeenCalledWith('mailto:a@stolaf.edu')
		expect(Alert.alert).not.toHaveBeenCalled()
	})
})

describe('formatEmailParts', () => {
	it('should format empty inputs', () => {
		expect(formatEmailParts({to: ['']})).toMatchInlineSnapshot('"mailto:"')
	})

	it('should encode the "to" addressees', () => {
		expect(formatEmailParts({to: ['test@domain.com']})).toMatchInlineSnapshot(
			'"mailto:test@domain.com"',
		)
		expect(formatEmailParts({to: ['test@domain.com', 'help@domain.com']})).toMatchInlineSnapshot(
			'"mailto:test@domain.com,help@domain.com"',
		)
	})

	it('should encode the "cc" addressees', () => {
		expect(formatEmailParts({cc: ['test@domain.com']})).toMatchInlineSnapshot(
			'"mailto:?cc=test%40domain.com"',
		)
		expect(formatEmailParts({cc: ['test@domain.com', 'help@domain.com']})).toMatchInlineSnapshot(
			'"mailto:?cc=test%40domain.com%2Chelp%40domain.com"',
		)
	})

	it('should encode the "bcc" addressees', () => {
		expect(formatEmailParts({bcc: ['test@domain.com']})).toMatchInlineSnapshot(
			'"mailto:?bcc=test%40domain.com"',
		)
		expect(formatEmailParts({bcc: ['test@domain.com', 'help@domain.com']})).toMatchInlineSnapshot(
			'"mailto:?bcc=test%40domain.com%2Chelp%40domain.com"',
		)
	})

	it('should encode the subject', () => {
		expect(formatEmailParts({subject: 'a thing'})).toMatchInlineSnapshot(
			'"mailto:?subject=a%20thing"',
		)
	})

	it('should encode to and subject', () => {
		expect(formatEmailParts({to: ['test@domain.com'], subject: 'a thing'})).toMatchInlineSnapshot(
			'"mailto:test@domain.com?subject=a%20thing"',
		)
	})

	it('should encode to, subject, and body', () => {
		expect(
			formatEmailParts({
				to: ['test@domain.com'],
				subject: 'a thing',
				body: 'hey there',
			}),
		).toMatchInlineSnapshot('"mailto:test@domain.com?subject=a%20thing&body=hey%20there"')
		expect(
			formatEmailParts({
				to: ['test@domain.com', 'test2@domain.com'],
				subject: 'a thing',
				body: 'hey there',
			}),
		).toMatchInlineSnapshot(
			'"mailto:test@domain.com,test2@domain.com?subject=a%20thing&body=hey%20there"',
		)
	})

	it('should encode to, cc, bcc, subject, and body', () => {
		expect(
			formatEmailParts({
				to: ['test@domain.com'],
				cc: ['test2@domain.com'],
				bcc: ['test3@domain.com'],
				subject: 'a thing',
				body: 'hey there',
			}),
		).toMatchInlineSnapshot(
			'"mailto:test@domain.com?cc=test2%40domain.com&bcc=test3%40domain.com&subject=a%20thing&body=hey%20there"',
		)
	})

	// `mailto:` follows RFC 6068, not the `application/x-www-form-urlencoded`
	// convention -- `+` is a literal plus sign there, not a decoded space, so a
	// mail client that percent-decodes per spec would show a literal "+".
	it('never encodes a space as +', () => {
		let href = formatEmailParts({
			to: ['test@domain.com'],
			subject: 'a thing',
			body: 'hey there',
		})

		expect(href).not.toContain('+')
	})
})
