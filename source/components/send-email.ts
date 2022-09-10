import {Alert} from 'react-native'
import Clipboard from '@react-native-community/clipboard'
import querystring from 'query-string'
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
	} catch (err) {
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
					onPress: () => Clipboard.setString(toString),
				},
			],
		)
	}
}

export function formatEmailParts(args: Args): string {
	const {to = [], cc = [], bcc = [], subject = '', body = ''} = args

	let encodedTo = encodeURIComponent(to.join(','))
	let query = querystring.stringify({cc, bcc, subject, body})

	return `mailto:${encodedTo}?${query}`
}
