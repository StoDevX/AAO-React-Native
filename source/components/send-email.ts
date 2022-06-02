import {Alert} from 'react-native'
import Clipboard from '@react-native-community/clipboard'
import {email} from 'react-native-communications'

type Args = {
	to?: Array<string>
	cc?: Array<string>
	bcc?: Array<string>
	subject?: string
	body?: string
}

export function sendEmail(args: Args): void {
	const {to = [], cc = [], bcc = [], subject = '', body = ''} = args
	try {
		email(to, cc, bcc, subject, body)
	} catch (err) {
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
