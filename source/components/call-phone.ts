import {Alert} from 'react-native'
import Clipboard from 'expo-clipboard'
import {openUrl} from '../modules/open-url'
import {noop} from 'lodash'
import {captureException} from '@sentry/react-native'

interface Options {
	prompt?: boolean
	title?: string
}

export async function callPhone(
	phoneNumber: string,
	opts: Options = {},
): Promise<void> {
	const {prompt = true, title = ''} = opts
	try {
		let phoneNumberAsUrl = `tel:${phoneNumber}`
		let promise = prompt
			? promptCall(title, phoneNumberAsUrl, phoneNumber)
			: openUrl(phoneNumberAsUrl)
		await promise
	} catch (err) {
		captureException(err)
		Alert.alert(
			"Apologies, we couldn't call that number",
			`We were trying to call "${phoneNumber}".`,
			[
				{
					text: 'Darn',
					onPress: () => {
						// do nothing.
					},
				},
				{
					text: 'Copy number',
					onPress: () => {
						Clipboard.setStringAsync(phoneNumber).catch((err: unknown) =>
							captureException(err),
						)
					},
				},
			],
		)
	}
}

export const formatNumber = (phoneNumber: string): string => {
	let re = /^(1|)?(\d{3})(\d{3})(\d{4})$/u

	let cleaned = String(phoneNumber).replace(/\D/gu, '')
	let match = re.exec(cleaned)

	if (match) {
		let intlCode = match[1] ? '+1 ' : ''
		return `${intlCode}(${match[2]}) ${match[3]}-${match[4]}`
	}

	return phoneNumber
}

const promptCall = (
	buttonText: string,
	phoneNumberAsUrl: string,
	phoneNumber: string,
): Promise<void> => {
	Alert.alert(buttonText, formatNumber(phoneNumber), [
		{text: 'Cancel', onPress: noop},
		{
			text: 'Call',
			onPress: () => {
				openUrl(phoneNumberAsUrl).catch((err: unknown) => captureException(err))
			},
		},
	])
	return Promise.resolve()
}
