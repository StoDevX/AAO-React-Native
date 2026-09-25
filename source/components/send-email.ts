import {Alert} from 'react-native'
import * as MailComposer from 'expo-mail-composer'
import {openOrOfferCopy} from './open-or-offer-copy'

type Args = {
	to?: Array<string>
	cc?: Array<string>
	bcc?: Array<string>
	subject?: string
	body?: string
}

export function sendEmail(args: Args): void {
	const {to = []} = args
	const toString = to.join(', ')

	void openOrOfferCopy(formatEmailParts(args), {
		title: "Apologies, we couldn't open an email client",
		message: `We were trying to email "${toString}".`,
		copyLabel: 'Copy addresses',
		copyText: toString,
	})
}

/** The compose sheet's outcomes that leave the email with Mail. */
const HANDED_OFF: Array<string> = ['sent', 'saved']

/**
 * Writes an email that carries `attachments` (file URIs) in Mail's own compose
 * sheet. With nothing to attach, the email goes out as a `mailto:` link, so it
 * opens in whichever mail app the reader chose rather than in Apple Mail.
 * Without an account in Apple Mail the sheet cannot open, and since a
 * `mailto:` link cannot carry attachments, the reader is asked first whether
 * to send the email without them.
 *
 * Resolves `true` once the email has been handed off -- sent or saved from the
 * sheet, or opened as a `mailto:` link -- and `false` when the reader backed
 * out. Rejects when the sheet could not be opened.
 */
export async function composeEmail(args: Args & {attachments?: Array<string>}): Promise<boolean> {
	const {attachments = [], ...email} = args

	if (attachments.length === 0) {
		sendEmail(email)
		return true
	}

	if (await MailComposer.isAvailableAsync()) {
		const {to = [], cc = [], bcc = [], subject, body} = email
		const {status} = await MailComposer.composeAsync({
			recipients: to,
			ccRecipients: cc,
			bccRecipients: bcc,
			subject,
			body,
			attachments,
		})
		return HANDED_OFF.includes(status)
	}

	return new Promise((resolve) => {
		Alert.alert(
			'Images cannot be attached',
			'Apple Mail has no account set up on this device, and only Apple Mail can attach the images. You can still send the report without them.',
			[
				{text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
				{
					text: 'Send Without Images',
					onPress: () => {
						sendEmail(email)
						resolve(true)
					},
				},
			],
		)
	})
}

export function formatEmailParts(args: Args): string {
	const {to = [], cc = [], bcc = [], subject = '', body = ''} = args

	// `mailto:` follows RFC 6068, not the `application/x-www-form-urlencoded`
	// convention: `+` is a literal plus sign there, not a decoded space. So this
	// builds the query string with `encodeURIComponent`, which percent-encodes
	// a space as `%20`, instead of `URLSearchParams`, which encodes it as `+`.
	const params: Array<[string, string]> = []

	if (cc.length > 0) {
		params.push(['cc', cc.join(',')])
	}

	if (bcc.length > 0) {
		params.push(['bcc', bcc.join(',')])
	}

	if (subject) {
		params.push(['subject', subject])
	}

	if (body) {
		params.push(['body', body])
	}

	const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')

	return `mailto:${to.join(',')}${query ? `?${query}` : ''}`
}
