import {Alert} from 'react-native'
import * as Clipboard from 'expo-clipboard'
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

export function formatEmailParts(args: Args): string {
	const {to = [], cc = [], bcc = [], subject = '', body = ''} = args

	// `mailto:` follows RFC 6068, not the `application/x-www-form-urlencoded`
	// convention: `+` is a literal plus sign there, not a decoded space. So this
	// builds the query string with `encodeURIComponent`, which percent-encodes
	// a space as `%20`, instead of `URLSearchParams`, which encodes it as `+`.
	const params: Array<[string, string]> = []

	if (cc.length) {
		params.push(['cc', cc.join(',')])
	}

	if (bcc.length) {
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
