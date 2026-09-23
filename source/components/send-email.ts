import {Alert} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as MailComposer from 'expo-mail-composer'
import {openUrl} from '@frogpond/open-url'

type Args = {
	to?: Array<string>
	cc?: Array<string>
	bcc?: Array<string>
	subject?: string
	body?: string
}

export function sendEmail(args: Args): void {
	try {
		openUrl(formatEmailParts(args))
	} catch (_err) {
		const {to = []} = args
		const toString = to.join(', ')

		Alert.alert(
			"Apologies, we couldn't open an email client",
			`We were trying to email "${toString}".`,
			[
				{
					text: 'Darn',
					onPress: () => {
						// do nothing
					},
				},
				{
					text: 'Copy addresses',
					onPress: () => void Clipboard.setStringAsync(toString),
				},
			],
		)
	}
}

/**
 * Writes an email in Mail's own compose sheet, which can carry `attachments`
 * (file URIs). Without an account in Mail that sheet cannot open, so the email
 * goes out as a `mailto:` link instead -- which cannot carry attachments, so
 * the reader is asked first whether to send it without them.
 */
export async function composeEmail(args: Args & {attachments?: Array<string>}): Promise<void> {
	const {attachments = [], ...email} = args

	if (await MailComposer.isAvailableAsync()) {
		const {to = [], cc = [], bcc = [], subject, body} = email
		await MailComposer.composeAsync({
			recipients: to,
			ccRecipients: cc,
			bccRecipients: bcc,
			subject,
			body,
			attachments,
		})
		return
	}

	if (attachments.length === 0) {
		sendEmail(email)
		return
	}

	Alert.alert(
		'Images cannot be attached',
		'Mail has no account set up on this device, so the images cannot come along. You can still send the report without them.',
		[
			{text: 'Cancel', style: 'cancel'},
			{text: 'Send Without Images', onPress: () => sendEmail(email)},
		],
	)
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
