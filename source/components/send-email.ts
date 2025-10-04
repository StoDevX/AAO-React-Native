import {Alert} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
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
	} catch {
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

	let mailto = new URL(`mailto:${to.join(',')}`)

	if (cc.length) {
		mailto.searchParams.append('cc', cc.join(','))
	}

	if (bcc.length) {
		mailto.searchParams.append('bcc', bcc.join(','))
	}

	if (subject) {
		mailto.searchParams.append('subject', subject)
	}

	if (body) {
		mailto.searchParams.append('body', body)
	}

	return mailto.href
}
