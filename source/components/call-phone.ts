import {Alert} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {openUrl} from '@frogpond/open-url'
import {noop} from 'lodash'

type Options = {
	prompt?: boolean
	title?: string
}

export function callPhone(phoneNumber: string, opts?: Options): void {
	const {prompt = true, title = ''} = opts || {}
	try {
		let phoneNumberAsUrl = `tel:${phoneNumber}`
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		prompt
			? promptCall(title, phoneNumberAsUrl, phoneNumber)
			: openUrl(phoneNumberAsUrl)
	} catch {
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
					onPress: () => Clipboard.setString(phoneNumber),
				},
			],
		)
	}
}

export const formatNumber = (phoneNumber: string): string => {
	let re = /^(1|)?(\d{3})(\d{3})(\d{4})$/u

	let cleaned = String(phoneNumber).replace(/\D/gu, '')
	let match = cleaned.match(re)

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
) => {
	Alert.alert(buttonText, formatNumber(phoneNumber), [
		{text: 'Cancel', onPress: noop},
		{text: 'Call', onPress: () => openUrl(phoneNumberAsUrl)},
	])
}
