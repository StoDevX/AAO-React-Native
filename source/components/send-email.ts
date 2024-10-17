import {Alert} from 'react-native'
import Clipboard from 'expo-clipboard'
import {openUrl} from '../modules/open-url'
import {captureException} from '@sentry/react-native'

interface Args {
	to?: string[]
	cc?: string[]
	bcc?: string[]
	subject?: string
	body?: string
}

export async function sendEmail(args: Args): Promise<void> {
	try {
		await openUrl(formatEmailParts(args))
	} catch (err: unknown) {
		captureException(err)
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
					onPress: () => {
						Clipboard.setStringAsync(toString).catch((err: unknown) =>
							captureException(err),
						)
					},
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
